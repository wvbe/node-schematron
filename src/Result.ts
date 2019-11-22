import { slimdom } from 'slimdom-sax-parser';

import Assert from './Assert';
// import Phase from './Phase';
// import Rule from './Rule';
// import Pattern from './Pattern';

export default class Result {
	// pattern: Pattern;
	// phase?: Phase;
	// rule: Rule;
	assertId: string | null;
	isReport: boolean;
	context: slimdom.Node;
	message?: string;

	constructor(
		// pattern: Pattern,
		// phase?: Phase,
		// rule: Rule,
		context: slimdom.Node,
		assert: Assert,
		message?: string
	) {
		// this.pattern = pattern;
		// this.phase = phase;
		// this.rule = rule;
		this.assertId = assert.id;
		this.isReport = assert.isReport;
		this.context = context;
		this.message = message;
	}

	toJson () {
		return {
			assertId: this.assertId,
			isReport: this.isReport,
			context: this.context.outerHTML,
			message: this.message
		}
	}
}
