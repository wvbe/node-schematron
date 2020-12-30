import { Namespace, NS_XSLT } from './Namespace';

export class XsltFunction {
	localName: string;
	namespaceUri?: string;
	namespacePrefix?: string;
	parameters: XsltFunctionParam[];
	sequenceConstructors: string[];
	returnValue: XsltDataType;

	constructor(
		name: string,
		parameters: XsltFunctionParam[],
		// https://www.w3.org/TR/xslt20/#dt-sequence-constructor
		sequenceConstructors: string[],
		returnValue: XsltDataType
	) {
		const fullyQualifiedMatch = /Q{(.*)}(.*)/.exec(name);
		if (fullyQualifiedMatch) {
			this.namespaceUri = fullyQualifiedMatch[1];
		} else if (name.includes(':')) {
			this.namespacePrefix = name.substr(0, name.indexOf(':'));
		} else {
			throw new Error('Custom functions must have a namespace');
		}

		this.localName = name;
		this.parameters = parameters;
		this.sequenceConstructors = sequenceConstructors;
		this.returnValue = returnValue;
	}

	// This method converts an <xsl:function> into an XQuery function definition. That definition is later thrown into
	// an XQuery (library) module that correlates with the namespace.
	getXqueryDefinition(_namespace: Namespace): string {
		// @TODO More intelligently transform sequence constructors to an actual program

		const parameters = this.parameters.map(param => `$${param.name}`).join('\n');
		const sequenceConstructors = this.sequenceConstructors
			.map(sequenceConstructor => `(${sequenceConstructor})`)
			.join(', ');
		return `declare %public function ${this.localName}(${parameters}) { (${sequenceConstructors}) };`;
	}

	isInNamespace(namespace: Namespace): boolean {
		if (this.namespaceUri) {
			return namespace.uri === this.namespaceUri;
		}
		if (this.namespacePrefix) {
			return namespace.prefix === this.namespacePrefix;
		}
		return false;
	}

	static QUERY = `map {
		"name": @name/string(),
		"returnValue": @as/string(),
		"parameters": array { ./Q{${NS_XSLT}}param/map {
			"name": @name/string(),
			"type": @as/string()
		}},
		"sequenceConstructors": array {
			(: TODO all possible sequence constructors :)
			./Q{${NS_XSLT}}value-of/string(@select)
		}
	}`;

	static fromJson(json: XsltFunctionJson): XsltFunction {
		return new XsltFunction(
			json.name,
			json.parameters,
			json.sequenceConstructors,
			json.returnValue
		);
	}
}

type XsltDataType = 'xs:boolean' | 'xs:string';

type XsltFunctionParam = {
	type: XsltDataType;
	name: string;
};

export type XsltFunctionJson = {
	name: string;
	parameters: XsltFunctionParam[];
	sequenceConstructors: string[];
	returnValue: XsltDataType;
};
