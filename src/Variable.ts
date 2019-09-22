import { evaluateXPath } from 'fontoxpath';

export default class Variable {
	name: string;
	value: string;

	constructor (name, value) {
		this.name = name;
		this.value = value;
	}

	static reduceVariables (context: any, variables: Variable[], initial: Object|null): Object {
		return variables.reduce(
			(mapping, variable) =>
				Object.assign(mapping, {
					[variable.name]: variable.value
						? evaluateXPath(variable.value, context, null, mapping)
						: context
				}),
			initial || {}
		);
	}
	static QUERY = `map {
		'name': @name/string(),
		'value': @value/string()
	}`;

	static fromJson (json): Variable {
		return new Variable(json.name, json.value);
	}
}