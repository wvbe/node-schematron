'use strict';

const fs = require('fs');
const SSP = require('slimdom-sax-parser');
const { evaluateXPathToNodes } = require('fontoxpath');

const { getSchematronResults } = require('..');

function createReportForSingleFile(fileName, xmlString, timeSpent, schematronOutput) {
	return {
		$fileName: fileName,
		$timeSpent: timeSpent,
		$results: schematronOutput.map((pattern) =>
			pattern.map((rule) =>
				rule.map((context) => ({
					...context,
					context: xmlString.substring(context.context.position.start, context.context.position.end)
				}))
			)
		)
	};
}

async function analyzeSingleFile(schematronRequest, $fileName) {
	const xmlString = await new Promise((resolve, reject) =>
		fs.readFile($fileName, 'utf8', (err, data) => (err ? reject(err) : resolve(data)))
	);

	const xmlDom = SSP.sync(xmlString, {
		position: true
	});

	try {
		const $results = getSchematronResults(schematronRequest, xmlDom).map((pattern) =>
			pattern.map((rule) =>
				rule.map((context) => ({
					...context,
					context: xmlString.substring(context.context.position.start, context.context.position.end)
				}))
			)
		)

		return {
			$fileName,
			$results
		};
	} catch (error) {
		console.log('> ' + error.message);
		return {
			$fileName,
			$results: [error]
		}
	}
}

process.on('message', (message) => {
	switch (message.type) {
		case 'kill':
			process.exit();
			return;

		case 'analyze':
			return message.fileList
				.reduce(async (deferred, fileName) => {
					const reports = await deferred;
					reports.push(await analyzeSingleFile(message.schematronRequest, fileName));
					return reports;
				}, Promise.resolve([]))
				.then((reports) => {
					process.send(reports);
				})
				.catch((err) => {
					console.error('Child process failed');
					console.error(err.stack);
					process.exit();
				});

		default:
			console.log('Unknown message type', message);
			process.exit(1);
			return;
	}
});
