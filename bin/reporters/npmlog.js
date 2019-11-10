const npmlog = require('npmlog');

const ASCII_COLOR_RED = '\x1b[31m';
const ASCII_COLOR_BLUE = '\u001b[34;1m';
const ASCII_COLOR_DEFAULT = '\x1b[0m';
const ASCII_CHECKMARK = ' ' + ASCII_COLOR_BLUE + '▲' + ASCII_COLOR_DEFAULT + ' ';
const ASCII_WARNING = ' ' + ASCII_COLOR_RED + '▼' + ASCII_COLOR_DEFAULT + ' ';
const ASCII_CROSSMARK = ' ' + ASCII_COLOR_RED + '✘' + ASCII_COLOR_DEFAULT + ' ';

// Configure the npmlog object
npmlog.prefixStyle = {};

// log.addLevel('verbose', 1000, { fg: 'blue', bg: 'black' }, 'verb')
// log.addLevel('info', 2000, { fg: 'green' })
// log.addLevel('timing', 2500, { fg: 'green', bg: 'black' })
npmlog.addLevel('report', 2501, { fg: 'grey' }, 'rprt');
npmlog.addLevel('pass', 2502, { fg: 'grey' }, 'pass');
// log.addLevel('http', 3000, { fg: 'green', bg: 'black' })
// log.addLevel('notice', 3500, { fg: 'blue', bg: 'black' })
// npmlog.addLevel('warn', 4000, { fg: 'yellow' }, 'WARN');
npmlog.addLevel('assert', 4001, { fg: 'brightRed' }, 'asrt');
npmlog.addLevel('fail', 4501, { fg: 'red' }, 'fail');
npmlog.addLevel('fileError', 4502, { fg: 'red' }, 'f-er');
// log.addLevel('error', 5000, { fg: 'red', bg: 'black' }, 'ERR!')

module.exports = function bindXunitReporterToEvents(req, events, stream) {
	const timeStartGlob = Date.now();
	let lastLoggedFileName = null;
	const filesWithAsserts = {};
	const stats = {
		files: null,
		filesWithoutResults: 0,
		filesWithAssertResults: 0,
		filesWithErrors: 0,
		totalAsserts: 0,
		totalReports: 0
	};

	npmlog.level = req.options['log-level'];

	if (req.parameters.glob) {
		npmlog.info('init', `Locating files matching "${req.parameters.glob}"`);
	}

	npmlog.info('init', `Reading schema from "${req.parameters.schematron}"`);

	/**
	 * Set some listeners (in chronological order)
	 */
	events.on('files', (files) => (stats.files = files.length));

	events.on('schema', (_schema) => {
		// not doing anything
	});

	let npmlogItem = null;
	let timeStartAnalysis = null;
	events.on('start', () => {
		npmlog.verbose('init', '%s files located in %s milliseconds', stats.files, Date.now() - timeStartGlob);
		npmlog.enableProgress();
		npmlog.info('init', `Starting validation`);

		npmlogItem = npmlog.newItem('0 of ' + stats.files, stats.files);
		timeStartAnalysis = Date.now();
	});

	events.on('file', (result, i) => {
		npmlogItem.name = i + 1 + ' of ' + stats.files;
		npmlogItem.completeWork(1);

		// It's possible the file could not be read, parsed or other
		if (result.$error) {
			npmlog.fail(null, result.$fileNameBase);
			npmlog.fileError(ASCII_WARNING, result.$error.message);
			++stats.filesWithErrors;
			return;
		}

		// Without validation results this file passed
		if (!result.$value.length) {
			npmlog.pass(null, result.$fileNameBase);
			++stats.filesWithoutResults;
			return;
		}

		// Create a file name caption for validation results in this document
		if (lastLoggedFileName !== result.$fileName) {
			lastLoggedFileName = result.$fileName;
			result.$value.some((v) => !v.isReport)
				? // If there is at least one <assert> that failed, the document fails
					npmlog.fail(null, result.$fileNameBase)
				: // Or it's happy days, there's only <report> results
					npmlog.pass(null, result.$fileNameBase);
		}

		result.$value.forEach((assert) => {
			// Not necessary to emit since `result` was already emitted:
			// events.emit('assert', assert);
			if (assert.isReport) {
				++stats.totalReports;
			} else {
				filesWithAsserts[result.$fileName] = (filesWithAsserts[result.$fileName] || 0) + 1;
				++stats.totalAsserts;
			}

			assert.isReport
				? npmlog.report(ASCII_CHECKMARK, assert.message.trim())
				: npmlog.assert(ASCII_CROSSMARK, assert.message.trim());
		});
	});

	events.on('end', (exitCode) => {
		stats.filesWithAssertResults = Object.keys(filesWithAsserts).length;
		stats.totalTime = Date.now() - timeStartAnalysis;

		const msPerDocument = (stats.totalTime / stats.files).toFixed(2);
		const documentPerSecond = (stats.files / stats.totalTime * 1000).toFixed(2);

		npmlog.disableProgress();

		npmlog.verbose(null, '%s milliseconds total', stats.totalTime);
		npmlog.verbose(null, '%s milliseconds per document', msPerDocument);
		npmlog.verbose(null, '%s documents per second', documentPerSecond);
		npmlog[stats.filesWithErrors ? 'error' : 'info'](null, '%s documents could not be validated', stats.filesWithErrors);
		npmlog.info(null, '%s documents passed', stats.files - stats.filesWithAssertResults);
		npmlog.info(null, '%s documents failed', stats.filesWithAssertResults);
		npmlog.verbose(null, '%s total fails', stats.totalAsserts);
		npmlog.verbose(null, '%s total reports', stats.totalReports);

		if (exitCode > 0) {
			npmlog.error('Not all documents passed, exiting with non-zero code')
		}
	});
};
