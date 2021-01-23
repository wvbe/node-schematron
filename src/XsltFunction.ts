import { Namespace, NS_XSLT } from './Namespace';

type XsltDataType = 'xs:boolean' | 'xs:string';

type XsltFunctionParam = {
	type: XsltDataType;
	name: string;
};

type SequenceConstructorValueOf = {
	type: 'value-of';
	select: string;
};
type SequenceConstructorVariable = {
	type: 'variable';
	name: string;
	select: string;
};
type SequenceConstructor = SequenceConstructorValueOf | SequenceConstructorVariable;

export type XsltFunctionJson = {
	name: string;
	parameters: XsltFunctionParam[];
	sequenceConstructors: SequenceConstructor[];
	returnValue: XsltDataType;
};

export class XsltFunction {
	localName: string;
	namespaceUri?: string;
	namespacePrefix?: string;
	parameters: XsltFunctionParam[];
	sequenceConstructors: SequenceConstructor[];
	returnValue: XsltDataType;

	constructor(
		name: string,
		parameters: XsltFunctionParam[],
		// https://www.w3.org/TR/xslt20/#dt-sequence-constructor
		sequenceConstructors: SequenceConstructor[],
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
	getXqueryDefinition(): string {
		// @TODO More intelligently transform sequence constructors to an actual program

		const parameters = this.parameters.map(param => `$${param.name}`).join('\n');
		const sequenceConstructors = this.sequenceConstructors
			.map((x, i) => {
				switch (x.type) {
					case 'value-of':
						return `${i > 0 ? 'return ' : ''}(${x.select})`;
					case 'variable':
						return `let $${x.name} := ${x.select}`;
					default:
						return x;
				}
			})
			.join('\n\t');
		return `declare %public function ${this.localName}(${parameters}) {\n\t(${sequenceConstructors})\n};`;
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
			./Q{${NS_XSLT}}variable/map {
				"type": "variable",
				"name": string(@name),
				"select": string(@select)
			},
			./Q{${NS_XSLT}}value-of/map {
				"type": "value-of",
				"select": string(@select)
			}
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
