import { Variable, VariableJson } from './Variable';

export class Phase {
	id: string;
	active: string[];
	variables: Variable[];

	constructor(id: string, active: string[], variables: Variable[]) {
		this.id = id;
		this.active = active;
		this.variables = variables;
	}

	static QUERY = `map {
		"id": @id/string(),
		"active": array { ./sch:active/@pattern/string() },
		'variables': array { ./sch:let/${Variable.QUERY}}
	}`;

	static fromJson(json: PhaseJson): Phase {
		return new Phase(
			json.id,
			json.active,
			json.variables.map(rule => Variable.fromJson(rule))
		);
	}
}

export type PhaseJson = {
	id: string;
	active: string[];
	variables: VariableJson[];
};
