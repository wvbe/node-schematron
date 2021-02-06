import { NS_XSLT } from './Namespace';
const TAB = '  ';

class XsltSequenceConstructorAbstract<T> {
	static TYPE: string;
	static QUERY: string;
	json: T;

	constructor(json: T) {
		this.json = json;
	}

	mapToXquf(_indent: string) {
		throw new Error('Not implemented');
	}
}

export class XsltSequenceConstructorVariable extends XsltSequenceConstructorAbstract<{
	type: 'variable';
	name: string;
	select: string | null;
	children: XsltSequenceConstructor[];
}> {
	static TYPE = 'variable';
	static QUERY = `map {
		"type": "variable",
		"name": string(@name),
		"select": if (exists(@select)) then string(@select) else (),
		"children": local:sequence-constructors(.)
	}`;

	mapToXquf(indent: string): string {
		return (
			indent +
			`let $${this.json.name} := ${
				this.json.select
					? this.json.select
					: `(${joinSequenceConstructors(
							this.json.children.map(instantiateSequenceConstructorFromJson),
							indent + TAB
					  )}${indent + TAB})`
			}`
		);
	}
}

export class XsltSequenceConstructorValueOf extends XsltSequenceConstructorAbstract<{
	type: 'value-of';
	select: string;
}> {
	static TYPE = 'value-of';
	static QUERY = `map {
		"type": "value-of",
		"select": string(@select)
	}`;

	mapToXquf(indent: string): string {
		return indent + `(${this.json.select})`;
	}
}

export class XsltSequenceConstructorChoose extends XsltSequenceConstructorAbstract<{
	type: 'choose';
	when: {
		test: string;
		children: XsltSequenceConstructor[];
	}[];
	otherwise: XsltSequenceConstructor[];
}> {
	static TYPE = 'choose';
	static QUERY = `map {
		"type": "choose",
		"when": array {
			./Q{${NS_XSLT}}when/map {
				"test": string(@test),
				"children": local:sequence-constructors(./Q{${NS_XSLT}}*)
			}
		},
		"otherwise": local:sequence-constructors(./Q{${NS_XSLT}}otherwise)
	}`;

	mapToXquf(indent: string): string {
		return (
			indent +
			'(: CHOOSE :)' +
			indent +
			this.json.when
				.map(
					condition =>
						`if (${condition.test})` +
						indent +
						TAB +
						`then (${joinSequenceConstructors(
							condition.children.map(instantiateSequenceConstructorFromJson),
							indent + TAB
						)}${indent + TAB})`
				)
				.join(indent + 'else ') +
			indent +
			TAB +
			`else (${joinSequenceConstructors(
				this.json.otherwise.map(instantiateSequenceConstructorFromJson),
				indent + TAB
			)}${indent + TAB})`
		);
	}
}

export class XsltSequenceConstructorIf extends XsltSequenceConstructorAbstract<{
	type: 'if';
	test: string;
	children: XsltSequenceConstructor[];
}> {
	static TYPE = 'if';
	static QUERY = `map {
		"type": "if",
		"test": string(./@test),
		"children": local:sequence-constructors(.)
	}`;

	mapToXquf(indent: string): string {
		return (
			indent +
			`if (${this.json.test})` +
			indent +
			TAB +
			`then ${joinSequenceConstructors(
				this.json.children.map(instantiateSequenceConstructorFromJson),
				indent + TAB
			)}` +
			indent +
			TAB +
			`else ()`
		);
	}
}
export class XsltSequenceConstructorForEach extends XsltSequenceConstructorAbstract<{
	type: 'for-each';
	select: string;
	children: XsltSequenceConstructor[];
}> {
	static TYPE = 'for-each';
	static QUERY = `map {
		"type": "for-each",
		"select": string(./@select),
		"children": local:sequence-constructors(.)
	}`;

	mapToXquf(indent: string): string {
		// @TODO create unique intermediary variable names for nested "for" loops:
		const ref = '$tweak_me';
		return (
			indent +
			`for ${ref} in ${this.json.select}` +
			indent +
			TAB +
			`return ${ref}/(` +
			joinSequenceConstructors(
				this.json.children.map(instantiateSequenceConstructorFromJson),
				indent + TAB
			) +
			indent +
			TAB +
			`)`
		);
	}
}

const xsltSequenceConstructorClasses = [
	XsltSequenceConstructorChoose,
	XsltSequenceConstructorValueOf,
	XsltSequenceConstructorVariable,
	XsltSequenceConstructorIf,
	XsltSequenceConstructorForEach
];

export type XsltSequenceConstructor =
	| XsltSequenceConstructorChoose
	| XsltSequenceConstructorVariable
	| XsltSequenceConstructorValueOf
	| XsltSequenceConstructorIf
	| XsltSequenceConstructorForEach;

export type XsltSequenceConstructorJson = XsltSequenceConstructor['json'];

export function instantiateSequenceConstructorFromJson(json: any) {
	const XsltSequenceConstructorClass = xsltSequenceConstructorClasses.find(
		X => X.TYPE === json.type
	);

	if (!XsltSequenceConstructorClass) {
		throw new Error('Cannot cast ' + JSON.stringify(json));
	}

	return new XsltSequenceConstructorClass(json);
}

export function joinSequenceConstructors(
	sequenceConstructors: (XsltSequenceConstructor | null)[],
	priorIndent: string = '\n'
) {
	const res = sequenceConstructors.filter(Boolean) as XsltSequenceConstructor[];

	let hasVariables = false;
	let code = '';
	let indent = priorIndent + TAB;
	for (let i = 0; i < res.length; i++) {
		const sequenceConstructor = res[i];
		if (sequenceConstructor.json.type === 'variable') {
			hasVariables = true;
			code += sequenceConstructor.mapToXquf(indent);
			continue;
		}
		if (hasVariables) {
			// There have been variables, but this is not a variable
			code += indent + `return (${sequenceConstructor.mapToXquf(indent + TAB)}${indent})`;
			break;
		}
		code += (i === 0 ? '' : ',') + sequenceConstructor.mapToXquf(indent);
	}
	return code;
}
