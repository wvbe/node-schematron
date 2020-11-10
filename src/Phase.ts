import { Variable } from './Variable';

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

	static fromJson(json: JsonPhase): Phase {
		return new Phase(
			json.id,
			json.active,
			json.variables.map(rule => Variable.fromJson(rule))
		);
	}
}

export type JsonPhase = {
	id: string;
	active: string[];
	variables: Variable[];
};
