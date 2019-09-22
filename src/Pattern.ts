import Variable from './Variable';
import Rule from './Rule';

export default class Pattern {
	id?: string;
	rules: Rule[];
	variables: Variable[];

	constructor(id: string | null, rules: Rule[], variables: Variable[]) {
		this.id = id;
		this.rules = rules;
		this.variables = variables;
	}

	validateDocument(documentDom, parentVariables) {
		const variables = Variable.reduceVariables(documentDom, this.variables, {
			...parentVariables
		});
		return this.rules.reduce(
			(results, rule) => results.concat(rule.validateDocument(documentDom, variables)),
			[]
		);
	}

	static QUERY = `map {
		'id': @id/string(),
		'rules': array{ ./sch:rule/${Rule.QUERY}},
		'variables': array { ./sch:let/${Variable.QUERY}}
	}`;

	static fromJson(json): Pattern {
		return new Pattern(
			json.id,
			json.rules.map(obj => Rule.fromJson(obj)),
			json.variables.map(obj => Variable.fromJson(obj))
		);
	}
}
