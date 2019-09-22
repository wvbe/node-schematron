const { test } = require('./util');

// Source of XML and Schematron samples:
// https://www.data2type.de/en/xml-xslt-xslfo/schematron/schematron-reference/

// Tests <let>
// See also section 5.4.6 of ISO/IEC 19757-3
describe('ISO/IEC 19757-3:2016, Section 5.4.6, <name />', () => {
	const { results } = test(
		`<lightning><thunder /></lightning>`,
		`<schema xmlns="http://purl.oclc.org/dsdl/schematron">
			<pattern>
				<rule context="/*/*">
					<report test="true()"><name /></report>
					<report test="true()"><name path=".." /></report>
				</rule>
			</pattern>
		</schema>`
	);

	const firstAssert = results[0];
	const secondAssert = results[1];

	it('Provides the names of nodes from the instance document to allow clearer assertions...', () => {
		expect(firstAssert.message).toBe('thunder');
	});

	// TODO
	xit('... and diagnostics.', () => {});

	it('The optional path attribute is an expression evaluated in the current context that returns a string that is the name of a node.', () => {
		expect(secondAssert.message).toBe('lightning');
	});

	// ALREADY PROVEN
	// " In the latter case, the name of the node is used"
});
