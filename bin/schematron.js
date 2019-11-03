#!/usr/bin/env node
const { Command, MultiOption } = require('ask-nicely');
const path = require('path');
const { sync } = require('slimdom-sax-parser');
const fs = require('fs');
const child_process = require('child_process');
const globby = require('globby');

const { Schema } = require('../dist/index');
const ASCII_COLOR_RED = '\x1b[31m';
const ASCII_COLOR_GREEN = '\x1b[32m';
const ASCII_COLOR_DEFAULT = '\x1b[0m';
const ASCII_CHECKMARK = ASCII_COLOR_GREEN + '✓' + ASCII_COLOR_DEFAULT;
const ASCII_CROSSMARK = ASCII_COLOR_RED + '✘' + ASCII_COLOR_DEFAULT;
const MAX_PER_BATCH = 1000;

function gatherResultsFromChildProcesses(schematronRequest, fileList) {
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
				schema: schematronRequest
			});
		}).then(doms => {
			// Recurse, or end
			return nextSlice.length
				? readNextBatch(nextSlice, accum.concat(doms))
				: accum.concat(doms);
		});
	})(fileList);
}

const TIME_SCRIPT_START = Date.now();
new Command()
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

		const schema = Schema.fromDomToJson(
			sync(
				await new Promise((resolve, reject) =>
					fs.readFile(req.parameters.schematron, 'utf8', (err, data) =>
						err ? reject(err) : resolve(data)
					)
				)
			)
		);

		(await gatherResultsFromChildProcesses(schema, [...req.options.files, ...globbedFiles]))
			// .filter(thing => thing.$value.some(v => v.message))
			.forEach(result => {
				const fileGroupName = '> ' + path.relative(cwd, result.$fileName);
				console.group(fileGroupName);
				result.$value.forEach(assert => {
					if (!assert.message) {
						return;
					}
					console.log(
						[
							assert.isReport ? ASCII_CHECKMARK : ASCII_CROSSMARK,
							assert.message.trim()
						].join('\t')
					);
				});
				console.groupEnd(fileGroupName);
			});

		console.log(`Done after ${((Date.now() - TIME_SCRIPT_START) / 1000).toFixed(2)} seconds`);
	})
	.execute(process.argv.slice(2))
	.catch(error => {
		console.error(error.stack);
		process.exit(1);
	});
