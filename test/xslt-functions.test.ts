import { evaluateXPath } from 'fontoxpath';
import { sync } from 'slimdom-sax-parser';
import { Schema } from '../src/index';
import { XsltFunction } from '../src/XsltFunction';

const xml = `<xml><num>0.5</num><num>1.5</num></xml>`;

describe('Custom XPath functions', () => {
	// it('Parses to the expected AST', () => {
	// 	expect(schema).toMatchSnapshot();
	// });

	xit('Work in reports and asserts', () => {
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

		const results = schema.validateString(xml, { debug: true });
		expect(results).toHaveLength(2);
		expect(results[0].message).toBe('Not greater than one');
		expect(results[1].message).toBe('Greater than one');
	});

	describe('Convertig XSLT to XQUF', () => {
		it('Simple function', () => {
			const json = evaluateXPath(
				XsltFunction.QUERY,
				sync(`<function xmlns="http://www.w3.org/1999/XSL/Transform" name="test:one" as="xs:boolean">
					<param name="input" as="xs:decimal"/>
					<value-of select="$input &gt; 1"/>
				</function>`).documentElement
			);
			expect(json).toEqual({
				name: 'test:one',
				parameters: [
					{
						name: 'input',
						type: 'xs:decimal'
					}
				],
				returnValue: 'xs:boolean',
				sequenceConstructors: [{ type: 'value-of', select: '$input > 1' }]
			});
			expect(XsltFunction.fromJson(json).getXqueryDefinition()).toMatchSnapshot();
		});
		it('PEPPOL function using variables', () => {
			const json = evaluateXPath(
				XsltFunction.QUERY,
				sync(`<function xmlns="http://www.w3.org/1999/XSL/Transform" name="u:gln" as="xs:boolean">
					<param name="val"/>
					<variable name="length" select="string-length($val) - 1"/>
					<variable name="digits" select="reverse(for $i in string-to-codepoints(substring($val, 0, $length + 1)) return $i - 48)"/>
					<variable name="weightedSum" select="sum(for $i in (0 to $length - 1) return $digits[$i + 1] * (1 + ((($i + 1) mod 2) * 2)))"/>
					<value-of select="(10 - ($weightedSum mod 10)) mod 10 = number(substring($val, $length + 1, 1))"/>
				</function>`).documentElement
			);
			expect(json).toEqual({
				name: 'u:gln',
				parameters: [
					{
						name: 'val',
						type: null
					}
				],
				returnValue: 'xs:boolean',
				sequenceConstructors: [
					{
						type: 'variable',
						name: 'length',
						select: 'string-length($val) - 1'
					},
					{
						type: 'variable',
						name: 'digits',
						select:
							'reverse(for $i in string-to-codepoints(substring($val, 0, $length + 1)) return $i - 48)'
					},
					{
						type: 'variable',
						name: 'weightedSum',
						select:
							'sum(for $i in (0 to $length - 1) return $digits[$i + 1] * (1 + ((($i + 1) mod 2) * 2)))'
					},
					{
						type: 'value-of',
						select:
							'(10 - ($weightedSum mod 10)) mod 10 = number(substring($val, $length + 1, 1))'
					}
				]
			});
			console.log(XsltFunction.fromJson(json).getXqueryDefinition());
			expect(XsltFunction.fromJson(json).getXqueryDefinition()).toMatchSnapshot();
		});
	});
});
