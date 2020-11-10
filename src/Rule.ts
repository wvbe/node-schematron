import { Assert, AssertJson } from './Assert';
import { Result } from './Result';
import { Variable, VariableJson } from './Variable';

import { FontoxpathOptions } from './types';

export class Rule {
	context: string;
	variables: Variable[];
	asserts: Assert[];

	constructor(context: string, variables: Variable[], asserts: Assert[]) {
		this.context = context;
		this.variables = variables;
		this.asserts = asserts;
	}

	validateNode(
		context: Node,
		parentVariables: Object | null,
		fontoxpathOptions: FontoxpathOptions
	): Result[] {
		const variables = Variable.reduceVariables(context, this.variables, fontoxpathOptions, {
			...parentVariables
		});

		return this.asserts
			.map(assert => assert.validateNode(context, variables, fontoxpathOptions))
			.filter(result => result !== null) as Result[];
	}

	static QUERY = `map {
		'context': @context/string(),
		'variables': array { ./sch:let/${Variable.QUERY}},
		'asserts': array{ ./(sch:report|sch:assert)/${Assert.QUERY}}
	}`;

	static fromJson(json: RuleJson): Rule {
		const variables = json.variables.map(rule => Variable.fromJson(rule));
		const asserts = json.asserts.map(rule => Assert.fromJson(rule));

		return new Rule(json.context, variables, asserts);
	}
}

export type RuleJson = {
	context: string;
	variables: VariableJson[];
	asserts: AssertJson[];
};
