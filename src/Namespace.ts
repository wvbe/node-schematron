import { XsltFunction } from './XsltFunction';

export const NS_SCH = 'http://purl.oclc.org/dsdl/schematron';
export const NS_XSLT = 'http://www.w3.org/1999/XSL/Transform';

export class Namespace {
	prefix: string;
	uri: string;

	constructor(prefix: string, uri: string) {
		this.prefix = prefix;
		this.uri = uri;
	}

	static QUERY = `map {
		"prefix": @prefix/string(),
		"uri": @uri/string()
	}`;

	static fromJson(json: NamespaceJson): Namespace {
		return new Namespace(json.prefix, json.uri);
	}

	static generateXqueryModulesForFunctions(
		namespaces: Namespace[],
		functions: XsltFunction[]
	): string[] {
		return (
			namespaces
				// .filter(namespace => functions.some(func => func.isInNamespace(namespace)))
				.map(
					namespace => `
						module namespace ${namespace.prefix} = "${namespace.uri}";
						${functions
							.filter(func => func.isInNamespace(namespace))
							.map(func => func.getXqueryDefinition(namespace))}
				`
				)
		);
	}
}

export type NamespaceJson = {
	prefix: string;
	uri: string;
};
