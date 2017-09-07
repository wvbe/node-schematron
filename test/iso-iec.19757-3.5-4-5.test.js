const { test } = require('./util');

// Source of XML and Schematron samples:
// https://www.data2type.de/en/xml-xslt-xslfo/schematron/schematron-reference/

// Tests <let>
// See also section 5.4.5 of ISO/IEC 19757-3
describe('ISO/IEC 19757-3:2016, Section 5.4.5, <let />', () => {
	it('If the let element is the child of a rule element, the variable is calculated and scoped to the current rule and context.', () => {
		const { results } = test(
			`<xml foo="err"><thunder foo="bar" /></xml>`,
			`<schema xmlns="http://purl.oclc.org/dsdl/schematron">
				<pattern>
					<rule context="//thunder">
						<let name="lightning" value="string(@foo)"/>
						<report test="$lightning = 'bar'"><value-of select="$lightning" /></report>
					</rule>
				</pattern>
			</schema>`
		);

		const firstPattern = results[0];
		const firstRule = firstPattern[0];
		const firstContext = firstRule[0];
		const firstAssert = firstContext.results[0];

		// This means that the named variable works in the assert test
		expect(firstAssert).toBeTruthy();

		// This means that the named variable works in message interpolation.
		expect(firstAssert).toBe('bar');
	});

	// TODO
	xit('Otherwise, the variable is calculated with the context of the instance document root', () => {});

	// ALREADY PROVEN
	// "The required name attribute is the name of the variable."

	// ALREADY PROVEN
	// "The value attribute is an expression evaluated in the current context"

	it('If no value attribute is specified, the value of the attribute is the element content of the let element.', () => {
		const { results } = test(
			`<xml foo="err"><thunder foo="bar" /></xml>`,
			`<schema xmlns="http://purl.oclc.org/dsdl/schematron">
				<pattern>
					<rule context="//thunder">
						<let name="lightning"/>
						<report test="$lightning/@foo = 'bar'"><value-of select="$lightning/@foo" /></report>
					</rule>
				</pattern>
			</schema>`
		);

		const firstPattern = results[0];
		const firstRule = firstPattern[0];
		const firstContext = firstRule[0];
		const firstAssert = firstContext.results[0];

		// In the assert test
		expect(firstAssert).toBeTruthy();

		// In message interpolation
		expect(firstAssert).toBe('bar');
	});

	// TODO
	xit(
		'It is an error to reference a variable that has not been defined in the current schema, phase, pattern, or ' +
			'rule, if the query language binding allows this to be determined reliably',
		() => {}
	);

	// TODO
	xit(
		'It is an error for a variable to be multiply defined in the current schema, phase, pattern and rule.',
		() => {}
	);

	// ALREADY PROVEN
	// "The variable is substituted into assertion tests and other expressions in the same rule before the test
	// or expression is evaluated."

	// UNSUPPORTED
	// "The query language binding specifies which lexical conventions are used to detect references to variables."
	// Query language bindings not supported
});
