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
const BR = '\n';
const TAB = '\t';
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
		return BR + indent + `let $${this.json.name} := ${this.json.select}`;
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
		return BR + indent + `(${this.json.select})`;
	}
}

export class XsltSequenceConstructorChoose extends XsltSequenceConstructorAbstract<{
	type: 'choose';
	when: {
		test: string;
		children: XsltSequenceConstructor[];
	};
	otherwise: XsltSequenceConstructor[];
}> {
	static TYPE = 'choose';
	static QUERY = `map {
		"type": "choose",
		"when": map {
			"test": string(./when/@test),
			"children": local:sequence-constructors(./when/.)
		},
		"otherwise": local:sequence-constructors(./otherwise)
	}`;

	mapToXquf(indent: string): string {
		return (
			BR +
			indent +
			`if (${this.json.when.test})` +
			BR +
			indent +
			TAB +
			`then (${compose(this.json.when.children.map(cast), indent + TAB)}${BR +
				indent +
				TAB})` +
			BR +
			indent +
			TAB +
			`else (${compose(this.json.otherwise.map(cast), indent + TAB)}${BR + indent + TAB})`
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
			BR +
			indent +
			`if (${this.json.test})` +
			BR +
			indent +
			TAB +
			`then ${compose(this.json.children.map(cast), indent + TAB)}` +
			BR +
			indent +
			TAB +
			`else ()`
		);
	}
}

const xsltSequenceConstructorClasses = [
	XsltSequenceConstructorChoose,
	XsltSequenceConstructorValueOf,
	XsltSequenceConstructorVariable,
	XsltSequenceConstructorIf
];

export type XsltSequenceConstructor =
	| XsltSequenceConstructorChoose
	| XsltSequenceConstructorVariable
	| XsltSequenceConstructorValueOf
	| XsltSequenceConstructorIf;

export function cast(json: any) {
	const XsltSequenceConstructorClass = xsltSequenceConstructorClasses.find(
		X => X.TYPE === json.type
	);

	if (!XsltSequenceConstructorClass) {
		throw new Error('Cannot cast ' + JSON.stringify(json));
	}

	return new XsltSequenceConstructorClass(json);
}

export function compose(
	sequenceConstructors: (XsltSequenceConstructor | null)[],
	priorIndent: string = ''
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
			code +=
				BR +
				indent +
				`return (${sequenceConstructor.mapToXquf(indent + TAB)}${BR + indent})`;
			break;
		}
		code += (i === 0 ? '' : ',') + sequenceConstructor.mapToXquf(indent);
	}
	return code;
}

export type XsltSequenceConstructorJson = XsltSequenceConstructor['json'];
