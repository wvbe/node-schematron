import { evaluateXPath } from 'fontoxpath';

export type JsonVariable = { name: string; value: string };

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
		namespaceResolver: (prefix?: string | null) => string | null,
		initial: Object | null
	): Object {
		return variables.reduce(
			(mapping, variable) =>
				Object.assign(mapping, {
					[variable.name]: variable.value
						? evaluateXPath(variable.value, context, null, mapping, undefined, {
								namespaceResolver
						  })
						: context
				}),
			initial || {}
		);
	}

	static QUERY = `map {
		'name': @name/string(),
		'value': @value/string()
	}`;

	static fromJson(json: JsonVariable): Variable {
		return new Variable(json.name, json.value);
	}
}
