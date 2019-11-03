import { evaluateXPathToNodes } from 'fontoxpath';

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
		const ruleContexts = this.rules.map(rule =>
			evaluateXPathToNodes('//(' + rule.context + ')', documentDom)
		);
		const flattenValidationResults = (results, node) => {
			const ruleIndex = ruleContexts.findIndex(context => context.includes(node));
			const rule = ruleIndex >= 0 ? this.rules[ruleIndex] : null;
			if (rule) {
				results.splice(results.length, 0, ...rule.validateNode(node, variables));
			}

			return node.childNodes.reduce(flattenValidationResults, results);
		};

		return documentDom.childNodes.reduce(flattenValidationResults, []);
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
