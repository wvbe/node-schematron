import { evaluateXPath } from 'fontoxpath';

import { FontoxpathOptions } from './types';

export class Variable {
	name: string;
	value: string;

	constructor(name: string, value: string) {
		this.name = name;
		this.value = value;
	}

	static reduceVariables(
		context: any,
		variables: Variable[],
		fontoxpathOptions: FontoxpathOptions,
		initial: Object | null
	): Object {
		return variables.reduce(
			(mapping, variable) =>
				Object.assign(mapping, {
					[variable.name]: variable.value
						? evaluateXPath(
								variable.value,
								context,
								null,
								mapping,
								undefined,
								fontoxpathOptions
						  )
						: context
				}),
			initial || {}
		);
	}

	static QUERY = `map {
		'name': @name/string(),
		'value': @value/string()
	}`;

	static fromJson(json: VariableJson): Variable {
		return new Variable(json.name, json.value);
	}
}

export type VariableJson = { name: string; value: string };
