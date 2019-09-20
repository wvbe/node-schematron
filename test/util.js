const { sync } = require('slimdom-sax-parser');

const { getSchematronRequest, getSchematronResults } = require('../');

module.exports = {
	// The public API's are passed on here just for convenience
	getSchematronRequest,
	getSchematronResults,

	// You don't have to use slimdom as an XML DOM, but it comes recommended so it's here for convenience
	parseDom: sync,

	//
	test: (documentString, schematronString, phase) => {
		const request = getSchematronRequest(sync(schematronString), phase);
		const results = getSchematronResults(request, sync(documentString));
		return { request, results };
	}
};
