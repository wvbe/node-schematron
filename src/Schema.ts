import { evaluateXPath } from 'fontoxpath';
import { sync } from 'slimdom-sax-parser';

import Variable from './Variable';
import Phase from './Phase';
import Pattern from './Pattern';
import Result from './Result';

export default class Schema {
	public title: string;
	public defaultPhase: string | null;
	public variables: Variable[];
	public phases: Phase[];
	public patterns: Pattern[];

	constructor(
		title: string,
		defaultPhase: string | null,
		variables: Variable[],
		phases: Phase[],
		patterns: Pattern[]
	) {
		this.title = title;
		this.defaultPhase = defaultPhase;
		this.variables = variables;
		this.phases = phases;
		this.patterns = patterns;
	}

	validateString(documentXmlString: string, phaseId?: string): Result[] {
		return this.validateDocument(sync(documentXmlString), phaseId);
	}

	validateDocument(documentDom: Document, phaseId?: string): Result[] {
		if (!phaseId) {
			phaseId = '#DEFAULT';
		}
		if (phaseId === '#DEFAULT') {
			phaseId = this.defaultPhase || '#ALL';
		}

		const variables = Variable.reduceVariables(documentDom, this.variables, {});

		if (phaseId === '#ALL') {
			return this.patterns
				.reduce((results, pattern) => results.concat(pattern.validateDocument(documentDom, variables)), []);
		}

		const phase = this.phases.find((phase) => phase.id === phaseId);
		const phaseVariables = Variable.reduceVariables(documentDom, phase.variables, { ...variables });

		return phase.active
			.map((patternId) => this.patterns.find((pattern) => pattern.id === patternId))
			.reduce((results, pattern) => results.concat(pattern.validateDocument(documentDom, phaseVariables)), []);
	}

	static fromJson(json): Schema {
		return new Schema(
			json.title,
			json.defaultPhase,
			json.variables.map((obj) => Variable.fromJson(obj)),
			json.phases.map((obj) => Phase.fromJson(obj)),
			json.patterns.map((obj) => Pattern.fromJson(obj))
		);
	}

	static fromString(schematronXmlString: string): Schema {
		return Schema.fromDom(sync(schematronXmlString));
	}

	static fromDom(schematronDom: Document): Schema {
		return Schema.fromJson(Schema.fromDomToJson(schematronDom));
	}

	static fromDomToJson(schematronDom: Document): Object {
		return evaluateXPath(
			`
				declare namespace sch = 'http://purl.oclc.org/dsdl/schematron';

				declare function local:json($node as node()) {
					if ($node[self::text()])
						then $node/string()
					else
					map:merge((
						map:entry('$type', $node/name()),
						for $attr in $node/@*
							return map:entry($attr/name(), $attr/string())
					))
				};

				let $context := /*[1]
				return map {
					'title': $context/@title/string(),
					'defaultPhase': $context/@defaultPhase/string(),
					'phases': array { $context/sch:phase/${Phase.QUERY}},
					'patterns': array { $context/sch:pattern/${Pattern.QUERY}},
					'variables': array { $context/sch:let/${Variable.QUERY}}
				}
			`,
			schematronDom,
			null,
			{},
			null,
			{ language: evaluateXPath.XQUERY_3_1_LANGUAGE }
		);
	}
}
