import { Schema, registerCustomXPathFunction } from '../src/index';

describe('Custom XPath functions', () => {
	const schema = Schema.fromString(
		`<schema xmlns="http://purl.oclc.org/dsdl/schematron">
			<pattern>
				<rule context="*">
					<report test="Q{http://example.com}is-foo(@bar)">Bar is foo</report>
					<assert test="Q{http://example.com}is-foo(@baz)">Baz is not foo</assert>
				</rule>
			</pattern>
		</schema>`
	);

	registerCustomXPathFunction(
		{
			localName: 'is-foo',
			namespaceURI: 'http://example.com'
		},
		['xs:string?'],
		'xs:boolean',
		(_domFacade, input) => input === 'foo'
	);

	it('Work in reports and asserts', () => {
		const results = schema.validateString(`<xml bar="foo" baz="boo" />`);
		expect(results).toHaveLength(2);
		expect(results[0].message).toBe('Bar is foo');
		expect(results[1].message).toBe('Baz is not foo');
	});
});
