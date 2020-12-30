import { evaluateXPath, registerXQueryModule } from 'fontoxpath';
import { sync } from 'slimdom-sax-parser';

import { Namespace, NamespaceJson, NS_SCH, NS_XSLT } from './Namespace';
import { Pattern, PatternJson } from './Pattern';
import { Phase, PhaseJson } from './Phase';
import { Result } from './Result';
import { Variable, VariableJson } from './Variable';

import { FontoxpathOptions } from './types';
import { XsltFunction, XsltFunctionJson } from './XsltFunction';

export class Schema {
	public title: string;
	public defaultPhase: string | null;
	public variables: Variable[];
	public phases: Phase[];
	public patterns: Pattern[];
	public namespaces: Namespace[];
	public functions: XsltFunction[];

	constructor(
		title: string,
		defaultPhase: string | null,
		variables: Variable[],
		phases: Phase[],
		patterns: Pattern[],
		namespaces: Namespace[],
		functions: XsltFunction[]
	) {
		this.title = title;
		this.defaultPhase = defaultPhase;
		this.variables = variables;
		this.phases = phases;
		this.patterns = patterns;
		this.namespaces = namespaces;
		this.functions = functions;
	}

	validateString(documentXmlString: string, options?: ValidatorOptions): Result[] {
		// Typescript casting slimdom.Document to Document, which are the same
		return this.validateDocument((sync(documentXmlString) as unknown) as Document, options);
	}

	validateDocument(documentDom: Document, options?: ValidatorOptions): Result[] {
		let { phaseId, debug } = options || {};
		if (!phaseId) {
			phaseId = '#DEFAULT';
		}
		if (phaseId === '#DEFAULT') {
			phaseId = this.defaultPhase || '#ALL';
		}

		Namespace.generateXqueryModulesForFunctions(this.namespaces, this.functions).forEach(
			module => {
				console.log(module);

				registerXQueryModule(module);
			}
		);

		const fontoxpathOptions: FontoxpathOptions = {
			namespaceResolver: this.getNamespaceUriForPrefix.bind(this),
			moduleImports: this.namespaces.reduce(
				(all, namespace) => ({ ...all, [namespace.prefix]: namespace.uri }),
				{}
			),
			debug
		};

		const variables = Variable.reduceVariables(
			documentDom,
			this.variables,
			fontoxpathOptions,
			{}
		);

		if (phaseId === '#ALL') {
			return this.patterns.reduce(
				(results: Result[], pattern) =>
					results.concat(
						pattern.validateDocument(documentDom, variables, fontoxpathOptions)
					),
				[]
			);
		}

		const phase = this.phases.find(phase => phase.id === phaseId);
		const phaseVariables = Variable.reduceVariables(
			documentDom,
			phase?.variables || [],
			fontoxpathOptions,
			{
				...variables
			}
		);

		return (
			phase?.active
				.map(patternId => this.patterns.find(pattern => pattern.id === patternId))
				.reduce(
					(results: Result[], pattern) =>
						results.concat(
							pattern?.validateDocument(
								documentDom,
								phaseVariables,
								fontoxpathOptions
							) || []
						),
					[]
				) || []
		);
	}

	// TODO more optimally store the namespace prefix/uri mapping. Right now its modeled as an array because there
	// is a list of <ns> elements that are not really guaranteed to use unique prefixes.
	getNamespaceUriForPrefix(prefix?: string | null): string | null {
		if (!prefix) {
			return null;
		}
		const ns = this.namespaces.find(ns => ns.prefix === prefix);
		if (!ns) {
			throw new Error(
				`Namespace prefix "${prefix}" could not be resolved to an URI using <sch:ns>`
			);
		}

		return ns.uri;
	}

	static QUERY = `
		declare namespace sch = '${NS_SCH}';

		declare function local:json($node as node()) {
			if ($node[self::text()])
				then $node/string()
			else
			map:merge((
				map:entry('$type', $node/local-name()),
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
			'variables': array { $context/sch:let/${Variable.QUERY}},
			'namespaces': array { $context/sch:ns/${Namespace.QUERY}},
			'functions': array { $context/Q{${NS_XSLT}}function/${XsltFunction.QUERY}}
		}
	`;

	static fromJson(json: SchemaJson): Schema {
		return new Schema(
			json.title,
			json.defaultPhase,
			json.variables.map(obj => Variable.fromJson(obj)),
			json.phases.map(obj => Phase.fromJson(obj)),
			json.patterns.map(obj => Pattern.fromJson(obj)),
			json.namespaces.map(obj => Namespace.fromJson(obj)),
			json.functions.map(obj => XsltFunction.fromJson(obj))
		);
	}

	static fromDomToJson(schematronDom: Document): SchemaJson {
		return evaluateXPath(Schema.QUERY, schematronDom, null, {}, undefined, {
			language: evaluateXPath.XQUERY_3_1_LANGUAGE
		});
	}

	static fromDom(schematronDom: Document): Schema {
		return Schema.fromJson(Schema.fromDomToJson(schematronDom));
	}

	static fromString(schematronXmlString: string): Schema {
		return Schema.fromDom((sync(schematronXmlString) as unknown) as Document);
	}
}

export type SchemaJson = {
	title: string;
	defaultPhase: string | null;
	variables: VariableJson[];
	phases: PhaseJson[];
	patterns: PatternJson[];
	namespaces: NamespaceJson[];
	functions: XsltFunctionJson[];
};

export type ValidatorOptions = {
	phaseId?: string;
	debug?: boolean;
};
