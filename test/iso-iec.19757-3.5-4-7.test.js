import { Schema } from '../index';

// Tests <ns>
// See also section 5.4.7 of ISO/IEC 19757-3

describe('ISO/IEC 19757-3:2016, Section 5.4.7, <ns />', () => {
	// Not testing because this is an assertion about the schematron XML
	xit('Specification of a namespace prefix and URI. The required prefix attribute is an XML name with no colon character. The required uri attribute is a namespace URI [IRI].', () => {});

	// TODO
	it('In an ISO Schematron schema, namespace prefixes in context expressions, assertion tests and other query expressions should use the namespace bindings provided by this element.', () => {
		const results = Schema.fromString(`<schema xmlns="http://purl.oclc.org/dsdl/schematron">
				<ns uri="http://alpha" prefix="foo"/>
				<ns uri="http://beta" prefix="bar"/>
				<pattern>
					<rule context="foo:thunder">
						<report test="child::bar:*"><value-of select="bar:thunder/text()" /></report>
					</rule>
				</pattern>
			</schema>`)
			.validateString(`<lightning xmlns="http://def" xmlns:a="http://alpha" xmlns:b="http://beta">
				<a:thunder>
					Beta
					<b:thunder>Alpha</b:thunder>
					Beta
				</a:thunder>
			</lightning>`);
		expect(results[0].message).toBe('Alpha');
	});

	// TODO
	it('Namespace prefixes should not use the namespace bindings in scope for element and attribute names.', () => {
		expect(() =>
			Schema.fromString(
				`<schema xmlns="http://purl.oclc.org/dsdl/schematron">
					<ns uri="http://alpha" prefix="foo"/>
					<pattern>
						<rule context="a:thunder">
							<report test="true()"><value-of select="string(.)" /></report>
						</rule>
					</pattern>
				</schema>`
			)
				.validateString(`<lightning xmlns="http://def" xmlns:a="http://alpha" xmlns:b="http://beta">
					<a:thunder>Alpha</a:thunder>
					<b:thunder>Beta</b:thunder>
				</lightning>`)
		).toThrow(/"a"/g);
	});
});
