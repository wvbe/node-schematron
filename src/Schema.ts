import { evaluateXPath } from 'fontoxpath';
import { sync } from 'slimdom-sax-parser';

import Variable from './Variable';
import Phase from './Phase';
import Pattern from './Pattern';
import Namespace from './Namespace';
import Result from './Result';

export default class Schema {
	public title: string;
	public defaultPhase: string | null;
	public variables: Variable[];
	public phases: Phase[];
	public patterns: Pattern[];
	public namespaces: Namespace[];

	constructor(
		title: string,
		defaultPhase: string | null,
		variables: Variable[],
		phases: Phase[],
		patterns: Pattern[],
		namespaces: Namespace[]
	) {
		this.title = title;
		this.defaultPhase = defaultPhase;
		this.variables = variables;
		this.phases = phases;
		this.patterns = patterns;
		this.namespaces = namespaces;
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

		const namespaceResolver = this.getNamespaceUriForPrefix.bind(this);
		const variables = Variable.reduceVariables(documentDom, this.variables, namespaceResolver, {});

		if (phaseId === '#ALL') {
			return this.patterns.reduce(
				(results, pattern) =>
					results.concat(pattern.validateDocument(documentDom, variables, namespaceResolver)),
				[]
			);
		}

		const phase = this.phases.find((phase) => phase.id === phaseId);
		const phaseVariables = Variable.reduceVariables(documentDom, phase.variables, namespaceResolver, {
			...variables
		});

		return phase.active
			.map((patternId) => this.patterns.find((pattern) => pattern.id === patternId))
			.reduce(
				(results, pattern) =>
					results.concat(pattern.validateDocument(documentDom, phaseVariables, namespaceResolver)),
				[]
			);
	}

	// TODO more optimally store the namespace prefix/uri mapping. Right now its modeled as an array because there
	// is a list of <ns> elements that are not really guaranteed to use unique prefixes.
	getNamespaceUriForPrefix(prefix = null) {
		if (!prefix) {
			return null;
		}
		const ns = this.namespaces.find((ns) => ns.prefix === prefix);
		if (!ns) {
			throw new Error(`Namespace prefix "${prefix}" could not be resolved to an URI using <sch:ns>`);
		}

		return ns.uri;
	}

	static QUERY = `
		declare namespace sch = 'http://purl.oclc.org/dsdl/schematron';

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
			'namespaces': array { $context/sch:ns/${Namespace.QUERY}}
		}
	`;

	static fromJson(json): Schema {
		return new Schema(
			json.title,
			json.defaultPhase,
			json.variables.map((obj) => Variable.fromJson(obj)),
			json.phases.map((obj) => Phase.fromJson(obj)),
			json.patterns.map((obj) => Pattern.fromJson(obj)),
			json.namespaces.map((obj) => Namespace.fromJson(obj))
		);
	}

	static fromDomToJson(schematronDom: Document): Object {
		return evaluateXPath(Schema.QUERY, schematronDom, null, {}, null, {
			language: evaluateXPath.XQUERY_3_1_LANGUAGE
		});
	}

	static fromDom(schematronDom: Document): Schema {
		return Schema.fromJson(Schema.fromDomToJson(schematronDom));
	}

	static fromString(schematronXmlString: string): Schema {
		return Schema.fromDom(sync(schematronXmlString));
	}
}
