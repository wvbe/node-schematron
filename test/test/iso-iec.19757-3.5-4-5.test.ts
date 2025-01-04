import { Schema } from '../src/index';

// Tests <let>
// See also section 5.4.5 of ISO/IEC 19757-3

describe('ISO/IEC 19757-3:2016, Section 5.4.5, <let />', () => {
	it('If the let element is the child of a rule element, the variable is calculated and scoped to the current rule and context.', () => {
		const results = Schema.fromString(
			`<schema xmlns="http://purl.oclc.org/dsdl/schematron">
				<pattern>
					<rule context="thunder">
						<let name="lightning" value="string(@foo)"/>
						<report test="$lightning = 'bar'"><value-of select="$lightning" /></report>
					</rule>
				</pattern>
			</schema>`
		).validateString(`<xml foo="err"><thunder foo="bar" /></xml>`);

		const firstAssert = results[0];

		// This means that the named variable works in the assert test
		expect(firstAssert).toBeTruthy();

		// This means that the named variable works in message interpolation.
		expect(firstAssert.message).toBe('bar');
	});

	// TODO
	it('Otherwise, the variable is calculated with the context of the instance document root', () => {
		const results = Schema.fromString(
			`<schema xmlns="http://purl.oclc.org/dsdl/schematron">
				<let name="schemaVariable" value="concat('schema', child::*/name())"/>
				<phase id="test-me">
					<let name="phaseVariable" value="concat('phase', child::*/name())"/>
					<active pattern="pattern-me" />
				</phase>
				<pattern id="pattern-me">
					<let name="patternVariable" value="concat('pattern', child::*/name())"/>
					<rule context="thunder">
						<let name="ruleVariable" value="concat('rule', name())"/>
						<report test="true()">
							<value-of select="$schemaVariable" />
							<value-of select="$phaseVariable" />
							<value-of select="$patternVariable" />
							<value-of select="$ruleVariable" />
						</report>
					</rule>
				</pattern>
			</schema>`
		).validateString(`<xml><thunder /></xml>`, { phaseId: 'test-me' });
		const firstAssert = results[0];
		expect(firstAssert).toBeTruthy();

		// When <let /> is not a child of <rule />, use the document node as context
		expect(firstAssert.message).toContain('schemaxml');
		expect(firstAssert.message).toContain('phasexml');
		expect(firstAssert.message).toContain('patternxml');

		// When <let /> occurs in <rule />, use the context
		expect(firstAssert.message).toContain('rulethunder');
	});

	// ALREADY PROVEN
	// "The required name attribute is the name of the variable."

	// ALREADY PROVEN
	// "The value attribute is an expression evaluated in the current context"

	it('If no value attribute is specified, the value of the attribute is the element content of the let element.', () => {
		const results = Schema.fromString(
			`<schema xmlns="http://purl.oclc.org/dsdl/schematron">
				<pattern>
					<rule context="thunder">
						<let name="lightning"/>
						<report test="$lightning/@foo = 'bar'"><value-of select="$lightning/@foo" /></report>
					</rule>
				</pattern>
			</schema>`
		).validateString(`<xml foo="err"><thunder foo="bar" /></xml>`);

		// In the assert test
		expect(results[0]).toBeTruthy();

		// In message interpolation
		expect(results[0].message).toBe('bar');
	});

	it(
		'It is an error to reference a variable that has not been defined in the current schema, phase, pattern, or ' +
		'rule, if the query language binding allows this to be determined reliably',
		() => {
			expect(() =>
				Schema.fromString(
					`<schema xmlns="http://purl.oclc.org/dsdl/schematron">
						<pattern>
							<rule context="/*">
								<report test="$foobar" />
							</rule>
						</pattern>
					</schema>`
				).validateString(`<xml />`)
			).toThrow('foobar');
		}
	);

	// TODO
	xit('It is an error for a variable to be multiply defined in the current schema, phase, pattern and rule.', () => {});

	// ALREADY PROVEN
	// "The variable is substituted into assertion tests and other expressions in the same rule before the test
	// or expression is evaluated."

	// UNSUPPORTED
	// "The query language binding specifies which lexical conventions are used to detect references to variables."
	// Query language bindings not supported
});
