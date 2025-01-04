import * as fs from 'fs/promises';
import * as path from 'path';
import { Schema } from '../src';

// Tests <let>
// See also section 5.4.4 of ISO/IEC 19757-3

describe('ISO/IEC 19757-3:2016, Section 5.4.4, <include />', () => {
	it('should include the contents of the included file', async () => {
		const schema = await Schema.fromString(
			`<schema xmlns="http://purl.oclc.org/dsdl/schematron">
				<include href="iso-iec.19757-3.5-4-4.xml" />
			</schema>`,
			{
				// This mock fetchReference assumes all <include> references are absolute paths:
				fetchReference: href => fs.readFile(path.join(__dirname, 'xml', href), 'utf8')
			}
		);
		const [firstAssert] = schema.validateString(`<xml foo="err"><thunder foo="bar" /></xml>`);

		// This means that the named variable works in the assert test
		expect(firstAssert).toBeTruthy();

		// This means that the named variable works in message interpolation.
		expect(firstAssert.message).toBe('bar');
	});

	it('included files can include files again', async () => {
		const mockFiles: Record<string, string> = {
			'mammals/cat.xml': `
				<pattern xmlns="http://purl.oclc.org/dsdl/schematron" is-a="syntax">
					<include href="dog.xml" />
				</pattern>`,
			'mammals/dog.xml': `
				<rule xmlns="http://purl.oclc.org/dsdl/schematron" context="thunder">
					<let name="lightning" value="string(@foo)"/>
					<include href="../reptiles/snake.xml" />
				</rule>
			`,
			'reptiles/snake.xml': `
				<report xmlns="http://purl.oclc.org/dsdl/schematron" test="$lightning = 'bar'">
					<value-of select="$lightning" />
				</report>
			`
		};
		const schema = await Schema.fromString(
			`<schema xmlns="http://purl.oclc.org/dsdl/schematron">
				<include href="mammals/cat.xml" />
			</schema>`,
			{
				// This mock fetchReference handles all <include> references as relative paths:
				fetchReference: (href, referenceChain) => {
					const resolved = [...referenceChain, href].reduce(
						(acc, ref) => path.join(path.dirname(acc), ref),
						'.'
					);
					return mockFiles[resolved];
				}
			}
		);

		const [firstAssert] = schema.validateString(`<xml foo="err"><thunder foo="bar" /></xml>`);

		// This means that the named variable works in the assert test
		expect(firstAssert).toBeTruthy();

		// This means that the named variable works in message interpolation.
		expect(firstAssert.message?.trim()).toBe('bar');
	});
});
