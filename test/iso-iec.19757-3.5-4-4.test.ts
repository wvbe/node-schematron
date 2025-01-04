import { Schema } from '../src';

// Tests <let>
// See also section 5.4.4 of ISO/IEC 19757-3

describe('ISO/IEC 19757-3:2016, Section 5.4.4, <include />', () => {
	it('should include the contents of the included file', () => {
		const results = Schema.fromString(
			`<schema xmlns="http://purl.oclc.org/dsdl/schematron">
				<include href="iso-iec.19757-3.5-4-4.xml" />
			</schema>`, { resourceDir: `${__dirname}/xml` }
		).validateString(`<xml foo="err"><thunder foo="bar" /></xml>`);

		const firstAssert = results[0];

		// This means that the named variable works in the assert test
		expect(firstAssert).toBeTruthy();

		// This means that the named variable works in message interpolation.
		expect(firstAssert.message).toBe('bar');
	});
});
