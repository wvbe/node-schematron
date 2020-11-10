#!/usr/bin/env node

const path = require('path');
const EventEmitter = require('events');
const fs = require('fs');
const child_process = require('child_process');

const { Command, MultiOption, Option, Parameter } = require('ask-nicely');
const globby = require('globby');
const npmlog = require('npmlog');
const { sync } = require('slimdom-sax-parser');
const bindXunitReporterToEvents = require('./reporters/xunit');
const bindNpmlogReporterToEvents = require('./reporters/npmlog');
const { Schema } = require('../dist/index');

const REPORTERS_BY_NAME = {
	npm: bindNpmlogReporterToEvents,
	xunit: bindXunitReporterToEvents
};

// Serially send a bunch of file names off to a child process and call onResult every time there's a result
function gatherResultsFromChildProcesses(schema, { files, batch, phaseId, debug }, onResult) {
	return (function readNextBatch(fileList, accum = []) {
		const slice = fileList.length > batch ? fileList.slice(0, batch) : fileList;
		const nextSlice = fileList.length > batch ? fileList.slice(batch) : [];

		let i = 0;
		return new Promise(resolve => {
			const child = child_process.fork(
				path.resolve(__dirname, 'schematron.child_process.js')
			);

			child.on('message', message => {
				if (message) {
					return onResult(message, i++);
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
				options: {
					debug,
					phaseId
				}
			});
		}).then(doms => {
			// Recurse, or end
			return nextSlice.length
				? readNextBatch(nextSlice, accum.concat(doms))
				: accum.concat(doms);
		});
	})(files);
}

// Create an ask-nicely command parser and run it
new Command('node-schematron')
	.addParameter(
		new Parameter('schematron').setDescription('Your schematron file').addValidator(value => {
			if (!value) {
				throw new Error('The first parameter should be your schematron file');
			}
			if (!fs.existsSync(value)) {
				throw new Error("The schematron file doesn't exist");
			}
		})
	)
	.addParameter(
		new Parameter('glob')
			.setDescription('The files you want to validate, as a pattern (eg. "**/*.xml")')
			.setDefault('*.xml')
	)
	.addOption(
		new MultiOption('reporters')
			.setShort('r')
			.setDescription('Any number of reporters, space separated: xunit npm')
			.setDefault([null])
			.setResolver(value =>
				!value.length
					? [bindNpmlogReporterToEvents]
					: value
							.filter(name => !!name)
							.map(reporterName => {
								if (!REPORTERS_BY_NAME[reporterName]) {
									`Reporter "${reporterName}" does not exist, use any of: ${Object.keys(
										REPORTERS_BY_NAME
									).join(' ')}`;
								}
								return REPORTERS_BY_NAME[reporterName];
							})
			)
	)
	.addOption(
		new Option('ok')
			.setShort('o')
			.setDescription('Exit with a zero code (success) even if not all documents passed.')
			.isRequired(false)
	)
	.addOption(
		new MultiOption('files')
			.setShort('f')
			.setDescription('A list of source files. ')
			.isRequired(false)
	)
	.addOption(
		new Option('batch')
			.setShort('b')
			.setDescription('The amount of documents per child process.')
			.isRequired(false)
			.setDefault(5000, true)
			.setResolver(value => parseInt(value, 10))
	)
	.addOption(
		new Option('debug')
			.setShort('D')
			.setDescription('Print extra debug information for XPaths in Schematron, if they throw')
			.isRequired(false)
			.setResolver(
				value => value === true || value === 'true' || value === '1' || value === 1
			)
	)
	.addOption(
		new Option('phase')
			.setShort('p')
			.setDescription(
				'The schematron phase. Defaults to "#DEFAULT", which means the @defaultPhase attribute or all phases.'
			)
			.isRequired(false)
			.setDefault('#DEFAULT', true)
	)
	.addOption(
		new Option('log-level')
			.setShort('l')
			.setDescription(
				'The minimum log level to log. One of "verbose" (everything) "info" (schematron reports and stats, default), "warn" (failing asserts), "error" (failing documents and errors) or "silent".'
			)
			.isRequired(false)
			.setDefault('info', true)
	)
	.setController(async req => {
		// May be set to 1 (error) if not all documents pass
		process.exitCode = 0;

		const cwd = process.cwd();

		// Prepare an event listener and let all reporters add their listeners
		const events = new EventEmitter();
		req.options.reporters.forEach(reporter => reporter(req, events, process.stdout));

		// Find the files to validate
		const globbedFiles = req.parameters.glob
			? await globby([req.parameters.glob], {
					cwd,
					absolute: true
			  })
			: [];
		const files = [...req.options.files, ...globbedFiles];
		events.emit('files', files);

		// Parse the schema XML to a JSON object
		const schema = Schema.fromDomToJson(
			sync(
				await new Promise((resolve, reject) =>
					fs.readFile(req.parameters.schematron, 'utf8', (err, data) =>
						err ? reject(err) : resolve(data)
					)
				)
			)
		);
		events.emit('schema', schema);

		// Send the schema and (parts of) the file list to child process(es)
		events.emit('start');
		await gatherResultsFromChildProcesses(
			schema,
			{
				batch: req.options.batch,
				phaseId: req.options.phase,
				debug: req.options.debug,
				files
			},
			// Every time a document finishes validation, this callback is given the result
			(result, i) => {
				if (
					// Running into a validation error will set the process exit code to non-zero unless the --ok flag
					// is used.
					!req.options.ok &&
					(result.$error ||
						result.$value.some(assert => !assert.isReport && assert.message))
				) {
					process.exitCode = 1;
				}

				result.$fileNameBase = path.relative(cwd, result.$fileName).replace(/\\/g, '/');

				events.emit('file', result, i);
			}
		);

		events.emit('end', process.exitCode);
	})
	.execute(process.argv.slice(2))
	.catch(error => {
		// TODO Pass error to reporter(s)
		npmlog.disableProgress();
		npmlog.error('fatal', error.stack);

		process.exit(1);
	});
