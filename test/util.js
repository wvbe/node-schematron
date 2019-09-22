import { sync } from 'slimdom-sax-parser';

import Schema from '../src/Schema';

export const parseDom = sync;

export function test (documentString, schematronString, phase) {
	const request = Schema.fromDom(sync(schematronString));
	const results = request.validateDocument(sync(documentString), phase);

	return { request, results };
};
