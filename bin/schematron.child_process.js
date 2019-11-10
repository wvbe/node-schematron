'use strict';

const fs = require('fs');
const { Schema } = require('../dist/index');

async function validateFile(schema, phaseId, fileName) {
	try {
		const content = await new Promise((resolve, reject) =>
			fs.readFile(fileName, 'utf8', (error, data) => (error ? reject(error) : resolve(data)))
		);
		process.send({
			$fileName: fileName,
			$value: schema.validateString(content, phaseId).map((result) => result.toJson())
		});
	}
	catch (error) {
		process.send({
			$fileName: fileName,
			$error: {
				message: error.message
			}
		});
	}
}

process.on('message', async (message) => {
	if (message.type === 'analyze') {
		const schema = Schema.fromJson(message.schema);
		await Promise.all(message.fileList.map(validateFile.bind(null, schema, message.phaseId)));
		process.send(null);
		return;
	}

	if (message.type === 'kill') {
		process.exit();
		return;
	}

	console.log('Unknown message type', message);
	process.exit(1);
	return;
});
