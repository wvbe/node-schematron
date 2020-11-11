import { evaluateXPathToNodes } from 'fontoxpath';

import { Result } from './Result';
import { Rule, RuleJson } from './Rule';
import { Variable, VariableJson } from './Variable';

import { FontoxpathOptions } from './types';

export class Pattern {
	id: string | null;
	rules: Rule[];
	variables: Variable[];

	constructor(id: string | null, rules: Rule[], variables: Variable[]) {
		this.id = id;
		this.rules = rules;
		this.variables = variables;
	}

	validateDocument(
		documentDom: Document,
		parentVariables: object | null,
		fontoxpathOptions: FontoxpathOptions
	) {
		const variables = Variable.reduceVariables(documentDom, this.variables, fontoxpathOptions, {
			...parentVariables
		});
		const ruleContexts = this.rules.map(rule =>
			evaluateXPathToNodes(
				'//(' + rule.context + ')',
				documentDom,
				null,
				variables,
				fontoxpathOptions
			)
		);
		const flattenValidationResults = (results: Result[], node: Node): Result[] => {
			const ruleIndex = ruleContexts.findIndex(context => context.includes(node));
			const rule = ruleIndex >= 0 ? this.rules[ruleIndex] : null;
			if (rule) {
				results.splice(
					results.length,
					0,
					...rule.validateNode(node, variables, fontoxpathOptions)
				);
			}

			return Array.from(node.childNodes).reduce(flattenValidationResults, results);
		};

		return Array.from(documentDom.childNodes).reduce(flattenValidationResults, []);
	}

	static QUERY = `map {
		'id': @id/string(),
		'rules': array{ ./sch:rule/${Rule.QUERY}},
		'variables': array { ./sch:let/${Variable.QUERY}}
	}`;

	static fromJson(json: PatternJson): Pattern {
		return new Pattern(
			json.id,
			json.rules.map(obj => Rule.fromJson(obj)),
			json.variables.map(obj => Variable.fromJson(obj))
		);
	}
}

export type PatternJson = {
	id: string | null;
	rules: RuleJson[];
	variables: VariableJson[];
};
