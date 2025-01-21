import { Node, serializeToWellFormedString } from 'slimdom';
import { Assert } from './Assert';

export class Result {
	// pattern: Pattern;
	// phase?: Phase;
	// rule: Rule;
	assertId: string | null;
	isReport: boolean;
	context: Node;
	message?: string;

	constructor(
		// pattern: Pattern,
		// phase?: Phase,
		// rule: Rule,
		context: Node,
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

	toJson() {
		return {
			assertId: this.assertId,
			isReport: this.isReport,
			context: serializeToWellFormedString(this.context),
			message: this.message
		};
	}
}
