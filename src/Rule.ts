import Variable from './Variable';
import Assert from './Assert';

export default class Rule {
	context: string;
	variables: Variable[];
	asserts: Assert[];

	constructor(context, variables, asserts) {
		this.context = context;
		this.variables = variables;
		this.asserts = asserts;
	}

	validateNode(context, parentVariables, namespaceResolver) {
		const variables = Variable.reduceVariables(context, this.variables, namespaceResolver, {
			...parentVariables
		});

		return this.asserts
			.map(assert => assert.validateNode(context, variables, namespaceResolver))
			.filter(result => !!result);
	}

	static QUERY = `map {
		'context': @context/string(),
		'variables': array { ./sch:let/${Variable.QUERY}},
		'asserts': array{ ./(sch:report|sch:assert)/${Assert.QUERY}}
	}`;

	static fromJson(json): Rule {
		const variables = json.variables.map(rule => Variable.fromJson(rule));
		const asserts = json.asserts.map(rule => Assert.fromJson(rule));

		return new Rule(json.context, variables, asserts);
	}
}
