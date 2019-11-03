#!/usr/bin/env node
const { Command, MultiOption, Option } = require('ask-nicely');
const path = require('path');
const { sync } = require('slimdom-sax-parser');
const fs = require('fs');
const child_process = require('child_process');
const globby = require('globby');

const { Schema } = require('../dist/index');
const ASCII_COLOR_RED = '\x1b[31m';
const ASCII_COLOR_GREEN = '\x1b[32m';
const ASCII_COLOR_BLUE = '\x1b[34m';
const ASCII_COLOR_DEFAULT = '\x1b[0m';
const ASCII_CHECKMARK = ASCII_COLOR_BLUE + '△' + ASCII_COLOR_DEFAULT;
const ASCII_CROSSMARK = ASCII_COLOR_RED + '✘' + ASCII_COLOR_DEFAULT;

function gatherResultsFromChildProcesses(schema, { files, batch, phase }, onResult) {
	return (function readNextBatch(fileList, accum = []) {
		const slice = fileList.length > batch ? fileList.slice(0, batch) : fileList;
		const nextSlice = fileList.length > batch ? fileList.slice(batch) : [];

		return new Promise((resolve) => {
			const child = child_process.fork(path.resolve(__dirname, 'schematron.child_process.js'));

			child.on('message', (message) => {
				if (message) {
					return onResult(message);
				}

				// An empty message means end of transmission

				child.send({
					type: 'kill'
				});

				resolve();
			});

			child.send({
				type: 'analyze',
				fileList: slice,
				schema: schema,
				phaseId: phase
			});
		}).then((doms) => {
			// Recurse, or end
			return nextSlice.length ? readNextBatch(nextSlice, accum.concat(doms)) : accum.concat(doms);
		});
	})(files);
}

const TIME_SCRIPT_START = Date.now();
new Command()
	.addParameter('schematron')
	.addParameter('glob')
	.addOption(new MultiOption('files').setShort('f').setDescription('The source files').isRequired(false))
	.addOption(
		new Option('batch')
			.setShort('b')
			.setDescription('The amount of documents per child process')
			.setResolver((value) => parseInt(value || 5000, 10))
	)
	.addOption('phase', 'p', 'Phase')
	.setController(async (req) => {
		const cwd = process.cwd();

		const globbedFiles = req.parameters.glob
			? globby.sync([ req.parameters.glob ], {
					cwd,
					absolute: true
				})
			: [];

		const schema = Schema.fromDomToJson(
			sync(
				await new Promise((resolve, reject) =>
					fs.readFile(req.parameters.schematron, 'utf8', (err, data) => (err ? reject(err) : resolve(data)))
				)
			)
		);

		const files = [ ...req.options.files, ...globbedFiles ];

		let lastLoggedFileName = null;
		const filesWithAsserts = {};
		const stats = {
			files: files.length,
			filesWithoutResults: 0,
			filesWithAssertResults: 0,
			totalAsserts: 0,
			totalReports: 0
		}
		await gatherResultsFromChildProcesses(
			schema,
			{
				batch: req.options.batch,
				phase: req.options.phase,
				files
			},
			(result) => {
				if (!result.$value.length) {
					++stats.filesWithoutResults;
					return;
				}
				if (lastLoggedFileName !== result.$fileName) {
					lastLoggedFileName = result.$fileName;
					console.log('> ' + path.relative(cwd, result.$fileName).replace(/\\/g, '/'));
				}
				result.$value.forEach((assert) => {
					if (assert.isReport) {
						++stats.totalReports;
					} else {
						filesWithAsserts[result.$fileName] = (filesWithAsserts[result.$fileName] || 0) + 1;
						++stats.totalAsserts;
					}
					console.log(
						'  ' + [ assert.isReport ? ASCII_CHECKMARK : ASCII_CROSSMARK, assert.message.trim() ].join('  ')
					);
				});
			}
		);
		stats.filesWithAssertResults = Object.keys(filesWithAsserts).length;
		const milliseconds = (Date.now() - TIME_SCRIPT_START);
		const msPerDocument = (milliseconds/stats.files).toFixed(2);
		const documentPerSecond = (stats.files/milliseconds*1000).toFixed(2);

		console.log();
		console.log(`Validated ${stats.files} documents in ${(milliseconds / 1000).toFixed(2)} seconds (${msPerDocument}ms/d, ${documentPerSecond}d/s)`);
		console.log(`  Documents passed: ${stats.files - stats.filesWithAssertResults}`);
		console.log(`  Documents failed: ${stats.filesWithAssertResults}`);
		console.log(`  Total fails: ${stats.totalAsserts}`);
		console.log(`  Total reports: ${stats.totalReports}`);
	})
	.execute(process.argv.slice(2))
	.catch((error) => {
		console.error(error.stack);
		process.exit(1);
	});
