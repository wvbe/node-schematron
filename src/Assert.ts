import { evaluateXPathToBoolean, evaluateXPathToString } from 'fontoxpath';

import { Result } from './Result';

import { FontoxpathOptions } from './types';

export class Assert {
	id: string | null;
	test: string;
	message: Array<string | Object>;
	isReport: boolean;

	constructor(
		id: string | null,
		test: string,
		message: Array<string | Object>,
		isReport: boolean
	) {
		this.id = id;
		this.test = test;
		this.message = message;
		this.isReport = isReport;
	}

	createMessageString(
		contextNode: Node,
		variables: Object,
		fontoxpathOptions: FontoxpathOptions,
		chunks: Array<string | any>
	): string {
		return chunks
			.map((chunk): string => {
				if (typeof chunk === 'string') {
					return chunk;
				}

				// <sch:name />
				if (chunk.$type === 'name') {
					return evaluateXPathToString(
						'name(' + (chunk.path || '') + ')',
						contextNode,
						null,
						variables,
						fontoxpathOptions
					);
				}

				// <sch:value-of />
				if (chunk.$type === 'value-of') {
					return evaluateXPathToString(
						chunk.select,
						contextNode,
						null,
						variables,
						fontoxpathOptions
					);
				}

				console.log(chunk);
				throw new Error('Unsupported element in <sch:message>');
			})
			.join('');
	}

	validateNode(
		context: Node,
		variables: Object,
		fontoxpathOptions: FontoxpathOptions
	): Result | null {
		const outcome = evaluateXPathToBoolean(
			this.test,
			context,
			null,
			variables,
			fontoxpathOptions
		);
		return (!this.isReport && outcome) || (this.isReport && !outcome)
			? null
			: new Result(
					context,
					this,
					this.createMessageString(context, variables, fontoxpathOptions, this.message)
			  );
	}

	static QUERY = `map {
		'id': if (@id) then string(@id) else (),
		'test': @test/string(),
		'message': array { (./text()|./element())/local:json(.) },
		'isReport': boolean(local-name() = 'report')
	}`;

	static fromJson(json: AssertJson): Assert {
		return new Assert(json.id, json.test, json.message, json.isReport);
	}
}

export type AssertJson = {
	id: string | null;
	test: string;
	message: Array<string | Object>;
	isReport: boolean;
};
