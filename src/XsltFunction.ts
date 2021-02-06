import { Namespace, NS_XSLT } from './Namespace';
import { Schema } from './Schema';
import {
	instantiateSequenceConstructorFromJson,
	joinSequenceConstructors,
	XsltSequenceConstructor,
	XsltSequenceConstructorChoose,
	XsltSequenceConstructorForEach,
	XsltSequenceConstructorIf,
	XsltSequenceConstructorJson,
	XsltSequenceConstructorValueOf,
	XsltSequenceConstructorVariable
} from './XsltSequenceConstructor';

type XsltDataType = 'xs:boolean' | 'xs:string';

type XsltFunctionParam = {
	type: XsltDataType;
	name: string | null;
};

export type XsltFunctionJson = {
	name: string;
	parameters: XsltFunctionParam[];
	sequenceConstructors: XsltSequenceConstructorJson[];
	returnValue: XsltDataType;
};

export class XsltFunction {
	localName: string;
	namespaceUri?: string;
	namespacePrefix?: string;
	parameters: XsltFunctionParam[];
	sequenceConstructors: XsltSequenceConstructor[];
	returnValue: XsltDataType;

	constructor(
		name: string,
		parameters: XsltFunctionParam[],
		// https://www.w3.org/TR/xslt20/#dt-sequence-constructor
		sequenceConstructors: XsltSequenceConstructor[],
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
	getXqueryDefinition(schema: Schema): string {
		const parameters = this.parameters
			.map(param => `\n\t$${param.name} as ${param.type || 'item()'}`)
			.join(',');
		const schematronVariables = schema.variables.map(
			variable =>
				new XsltSequenceConstructorVariable({
					type: 'variable',
					children: [],
					name: variable.name,
					select: variable.value
				})
		);
		const sequenceConstructors = joinSequenceConstructors([
			...schematronVariables,
			...this.sequenceConstructors
		] as XsltSequenceConstructor[]);
		return `declare %public function ${this.localName}(${parameters}\n) {${sequenceConstructors}\n};`;
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

	static FUNCTIONS = `declare function local:sequence-constructors($node as node()*) {
		array {
			(: TODO all possible sequence constructors :)
			$node/Q{${NS_XSLT}}variable/${XsltSequenceConstructorVariable.QUERY},
			$node/Q{${NS_XSLT}}value-of/${XsltSequenceConstructorValueOf.QUERY},
			$node/Q{${NS_XSLT}}choose/${XsltSequenceConstructorChoose.QUERY},
			$node/Q{${NS_XSLT}}if/${XsltSequenceConstructorIf.QUERY},
			$node/Q{${NS_XSLT}}for-each/${XsltSequenceConstructorForEach.QUERY}
		}
	};`;

	static QUERY = `map {
		"name": @name/string(),
		"returnValue": @as/string(),
		"parameters": array { ./Q{${NS_XSLT}}param/map {
			"name": @name/string(),
			(:
				If the as attribute is omitted, then the required type is item()*.
				https://www.w3.org/TR/xslt-30/#parameter-type
			:)
			"type": @as/string()
		}},
		"sequenceConstructors": local:sequence-constructors(.)
	}`;

	static fromJson(json: XsltFunctionJson): XsltFunction {
		return new XsltFunction(
			json.name,
			json.parameters,
			json.sequenceConstructors
				.map(instantiateSequenceConstructorFromJson)
				.filter(Boolean) as XsltSequenceConstructor[],
			json.returnValue
		);
	}
}
