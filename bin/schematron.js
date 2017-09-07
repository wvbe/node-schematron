#!/usr/bin/env node
const { Command, MultiOption } = require('ask-nicely');
const path = require('path');
const SSP = require('slimdom-sax-parser');
const fs = require('fs');
const child_process = require('child_process');
const globby = require('globby');

const { getSchematronRequest } = require('..');
const ASCII_COLOR_RED = '\x1b[31m';
const ASCII_COLOR_GREEN = '\x1b[32m';
const ASCII_COLOR_DEFAULT = '\x1b[0m';
const ASCII_COLOR_DIM = '\x1b[2m';
const ASCII_CHECKMARK = ASCII_COLOR_GREEN + '✓' + ASCII_COLOR_DEFAULT;
const ASCII_CROSSMARK = ASCII_COLOR_RED + '✘' + ASCII_COLOR_DEFAULT;
const MAX_PER_BATCH = 1000;

function getDomsForRequest(schematronRequest, fileList) {
	let i = 0;
	const total = Math.ceil(fileList.length / MAX_PER_BATCH);
	// Read all files
	return (function readNextBatch(fileList, accum = []) {
		const slice = fileList.length > MAX_PER_BATCH ? fileList.slice(0, MAX_PER_BATCH) : fileList;
		const nextSlice = fileList.length > MAX_PER_BATCH ? fileList.slice(MAX_PER_BATCH) : [];

		return new Promise(resolve => {
			console.error('Batch ' + ++i + '/' + total);
			const child = child_process.fork(
				path.resolve(__dirname, 'schematron.child_process.js')
			);

			child.on('message', message => {
				child.send({
					type: 'kill'
				});

				resolve(message);
			});

			child.send({
				type: 'analyze',
				fileList: slice,
				schematronRequest
			});
		}).then(doms => {
			if (nextSlice.length) {
				return readNextBatch(nextSlice, accum.concat(doms));
			}

			return accum.concat(doms);
		});
	})(fileList);
}

// Combines the schematron "request" with the raw results and creates a more human-friendly object
// Also strips out the nullish results
function reduceResults(schematronResults, schematronRequest) {
	return schematronResults.reduce((all, file) => {
		const $fileName = file.$fileName;
		const $patterns = file.$results.reduce((all, patternResult, patternIndex) => {
			const patternRequest = schematronRequest.patterns[patternIndex];
			const $patternName = patternRequest.name;
			const $rules = patternResult.reduce((all, contextResults, ruleIndex) => {

				const ruleRequest = patternRequest.rules[ruleIndex];

				const $contexts = contextResults.reduce((all, contextResult) => {
					const $messages = contextResult.results.reduce(
						(all, feedbackResult, feedbackIndex) => {
							if (feedbackResult === null) {
								return all;
							}

							const feedbackRequest = ruleRequest.tests[feedbackIndex];
							return all.concat([
								{
									$isReport: feedbackRequest.isReport,
									$isAssertion: feedbackRequest.isAssertion,
									$message: feedbackResult
								}
							]);
						},
						[]
					);

					return $messages.length
						? all.concat([{ $context: contextResult.context, $messages }])
						: all;
				}, []);

				return $contexts.length
					? all.concat($contexts)
					: all;
			}, []);

			return $rules.length ? all.concat([
				{
					$patternName,
					$rules: $rules
				}
			]) : all;
		}, []);

		return $patterns.length ? all.concat([{ $fileName, $patterns: $patterns }]) : all;
	}, []);
}

const TIME_SCRIPT_START = Date.now();
new Command()
	.setDescription(`Show which attribute combinations are common.`)
	.addParameter('schematron')
	.addParameter('glob')
	.addOption(
		new MultiOption('files')
			.setShort('f')
			.setDescription('The source files')
			.isRequired(false)
	)
	.setController(async req => {
		const cwd = process.cwd();
		const globbedFiles = req.parameters.glob
			? globby.sync([req.parameters.glob], {
					cwd,
					absolute: true
			  })
			: [];

		const schematronRequest = getSchematronRequest(
			SSP.sync(
				await new Promise((resolve, reject) =>
					fs.readFile(req.parameters.schematron, 'utf8', (err, data) =>
						err ? reject(err) : resolve(data)
					)
				)
			)
		);

		const results = await getDomsForRequest(schematronRequest, [
			...req.options.files,
			...globbedFiles
		]);
		const cleanResults = reduceResults(results, schematronRequest);
		const totals = {
			totalAsserts: 0,
			totalReports: 0,
			totalFiles: results.length
		}

		console.dir(cleanResults, { depth: 20, colors: true});
		// return;

		cleanResults.forEach(res => {
			console.log('');
			const fileGroupName = '> ' + path.relative(cwd, res.$fileName);
			console.group(fileGroupName);

			res.$patterns.forEach(pattern => {
				console.group(pattern.$patternName || '[unnamed pattern]');

				pattern.$rules.forEach(rule => {

					// Commenting this out for a sec, makes results hard to read on non-color terminals
					// console.group(ASCII_COLOR_DIM + rule.$context + ASCII_COLOR_DEFAULT);

					rule.$messages.forEach(message => {
						totals[message.$isReport ? 'totalReports' : 'totalAsserts']++;
						console.log(
							[
								message.$isReport ? ASCII_CHECKMARK : ASCII_CROSSMARK,
								message.$message.trim()
							].join('\t')
						);
					});
					// console.groupEnd(ASCII_COLOR_DIM + rule.$context + ASCII_COLOR_DEFAULT);
				});
				console.groupEnd(pattern.$patternName || '[unnamed pattern]');
			});
			console.groupEnd(fileGroupName);
		});

		console.log('');
		console.log(`Done after ${((Date.now() - TIME_SCRIPT_START)/1000).toFixed(2)} seconds, ${totals.totalAsserts} assertions failed and ${totals.totalReports} reports generated from ${totals.totalFiles} files`);
	})
	.execute(process.argv.slice(2))
	.catch(error => {
		console.error(error.stack);
		process.exit(1);
	});
