import { Variable, JsonVariable } from './Variable';
import { Assert, JsonAssert } from './Assert';
import { Result } from './Result';

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
		namespaceResolver: (prefix?: string | null) => string | null
	): Result[] {
		const variables = Variable.reduceVariables(context, this.variables, namespaceResolver, {
			...parentVariables
		});

		return this.asserts
			.map(assert => assert.validateNode(context, variables, namespaceResolver))
			.filter(result => result !== null) as Result[];
	}

	static QUERY = `map {
		'context': @context/string(),
		'variables': array { ./sch:let/${Variable.QUERY}},
		'asserts': array{ ./(sch:report|sch:assert)/${Assert.QUERY}}
	}`;

	static fromJson(json: JsonRule): Rule {
		const variables = json.variables.map(rule => Variable.fromJson(rule));
		const asserts = json.asserts.map(rule => Assert.fromJson(rule));

		return new Rule(json.context, variables, asserts);
	}
}

export type JsonRule = {
	context: string;
	variables: JsonVariable[];
	asserts: JsonAssert[];
};
