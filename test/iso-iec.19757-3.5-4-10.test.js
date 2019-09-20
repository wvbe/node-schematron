const { test, getSchematronRequest, parseDom } = require('./util');

// Source of XML and Schematron samples:
// https://www.data2type.de/en/xml-xslt-xslfo/schematron/schematron-reference/

// Tests <phase>
// See also section 5.4.10 of ISO/IEC 19757-3
const SCHEMATRON = `<schema xmlns="http://purl.oclc.org/dsdl/schematron" defaultPhase="alpha">
	<phase id="alpha">
		<active pattern="alpha-pattern" />
	</phase>
	<phase id="beta">
		<active pattern="beta-pattern" />
	</phase>
	<pattern id="alpha-pattern">
		<rule context="//*">
			<let name="lightning" value="string(@foo)"/>
			<report test="true()">Alpha pattern</report>
		</rule>
	</pattern>
	<pattern id="beta-pattern">
		<rule context="//*">
			<let name="lightning" value="string(@foo)"/>
			<report test="true()">Beta pattern</report>
		</rule>
	</pattern>
</schema>`;
describe('ISO/IEC 19757-3:2016, Section 5.4.10, <phase />', () => {
	// A grouping of patterns, to name and declare variations in schemas, for example, to support progressive validation.
	// The required id attribute is the name of the phase. The element specifies the phase to be used for validating
	// documents, for example, by user command.
	it('The element specifies the phase to be used for validating documents, for example, by user command.', () => {
		const { results } = test(`<xml />`, SCHEMATRON, 'beta');

		const firstAssert = results[0][0][0].results[0];
		const secondPattern = results[1];

		// This means that the "alpha" phase was not executed
		expect(firstAssert).toBe('Beta pattern');
		expect(secondPattern).toBeFalsy();
	});

	// "Two names, #ALL and #DEFAULT, have special meanings."

	it('The name #ALL is reserved to denote that all patterns are active.', () => {
		const { results } = test(`<xml />`, SCHEMATRON, '#ALL');

		const firstAssert = results[0][0][0].results[0];
		const secondAssert = results[1][0][0].results[0];

		// This means that the "alpha" phase was not executed
		expect(firstAssert).toBe('Alpha pattern');
		expect(secondAssert).toBe('Beta pattern');
	});

	it('The name #DEFAULT is to denote that the name given in the defaultPhase attribute on the schema element should be used.', () => {
		const { results } = test(`<xml />`, SCHEMATRON, '#DEFAULT');

		const firstAssert = results[0][0][0].results[0];
		const secondPattern = results[1];

		// This means that the "alpha" phase was not executed
		expect(firstAssert).toBe('Alpha pattern');
		expect(secondPattern).toBeFalsy();
	});

	xit('If no defaultPhase is specified, then all patterns are active.', () => {});

	// The icon, see and fpi attributes allow rich interfaces and documentation.
});
