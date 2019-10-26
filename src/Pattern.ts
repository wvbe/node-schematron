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

		const validateNode = (results, node) => {
			const rule = this.rules.find(rule => rule.isMatchForNode(node, variables));
			if (rule) {
				results.splice(results.length, 0, ...rule.validateNode(node, variables));
			}

			return node.childNodes.reduce(validateNode, results);
		};

		return documentDom.childNodes.reduce(validateNode, []);
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
