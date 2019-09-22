'use strict';

const fs = require('fs');
const { Schema } = require('../dist/index');

process.on('message', (message) => {
	switch (message.type) {
		case 'kill':
			process.exit();
			return;

		case 'analyze':
			const schema = Schema.fromJson(message.schema);
			const results = message.fileList.map(fileName => ({
				$fileName: fileName,
				$value: schema.validateString(fs.readFileSync(fileName, 'utf8'))
					.map(result => result.toJson())
			}));
			return process.send(results);

		default:
			console.log('Unknown message type', message);
			process.exit(1);
			return;
	}
});
