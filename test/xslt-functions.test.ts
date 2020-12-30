import { Schema } from '../src/index';

const xml = `<xml><num>0.5</num><num>1.5</num></xml>`;
describe('Custom XPath functions', () => {
	const schema = Schema.fromString(
		`<schema xmlns="http://purl.oclc.org/dsdl/schematron">
			<ns uri="test" prefix="test" />
			<function xmlns="http://www.w3.org/1999/XSL/Transform" name="test:one" as="xs:boolean">
				<param name="input" as="xs:decimal"/>
				<value-of select="$input &gt; 1"/>
			</function>
			<pattern>
				<rule context="num">
					<report test="test:one(number(.))">Greater than one</report>
					<assert test="test:one(number(.))">Not greater than one</assert>
				</rule>
			</pattern>
		</schema>`
	);

	// it('Parses to the expected AST', () => {
	// 	expect(schema).toMatchSnapshot();
	// });

	it('Work in reports and asserts', () => {
		const results = schema.validateString(xml, { debug: true });
		expect(results).toHaveLength(2);
		expect(results[0].message).toBe('Not greater than one');
		expect(results[1].message).toBe('Greater than one');
	});
});
