import { evaluateXPath } from 'fontoxpath';
import { sync } from 'slimdom-sax-parser';
import { Schema } from '../src/index';
import { XsltFunction } from '../src/XsltFunction';

const xml = `<xml><num>0.5</num><num>1.5</num></xml>`;
function parse(xml: TemplateStringsArray) {
	return evaluateXPath(
		`
			${XsltFunction.FUNCTIONS}
			${XsltFunction.QUERY}
		`,
		sync(xml.join('')).documentElement,
		null,
		{},
		undefined,
		{
			language: evaluateXPath.XQUERY_3_1_LANGUAGE
		}
	);
}
const sch = new Schema('derp', 'derp', [], [], [], [], []);
describe('Custom XPath functions', () => {
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
			const json = parse`<function xmlns="http://www.w3.org/1999/XSL/Transform" name="test:one" as="xs:boolean">
					<param name="input" as="xs:decimal"/>
					<value-of select="$input &gt; 1"/>
				</function>`;
			expect(json).toEqual({
				name: 'test:one',
				returnValue: 'xs:boolean',
				parameters: [
					{
						name: 'input',
						type: 'xs:decimal'
					}
				],
				sequenceConstructors: [
					{
						type: 'value-of',
						select: '$input > 1'
					}
				]
			});
			expect(XsltFunction.fromJson(json).getXqueryDefinition(sch)).toMatchSnapshot();
		});

		it('PEPPOL function using variables', () => {
			const json = parse`<function xmlns="http://www.w3.org/1999/XSL/Transform" name="u:gln" as="xs:boolean">
					<param name="val"/>
					<variable name="length" select="string-length($val) - 1"/>
					<variable name="digits" select="reverse(for $i in string-to-codepoints(substring($val, 0, $length + 1)) return $i - 48)"/>
					<variable name="weightedSum" select="sum(for $i in (0 to $length - 1) return $digits[$i + 1] * (1 + ((($i + 1) mod 2) * 2)))"/>
					<value-of select="(10 - ($weightedSum mod 10)) mod 10 = number(substring($val, $length + 1, 1))"/>
				</function>`;

			expect(json).toEqual({
				name: 'u:gln',
				returnValue: 'xs:boolean',
				parameters: [
					{
						name: 'val',
						type: null
					}
				],
				sequenceConstructors: [
					{
						type: 'variable',
						name: 'length',
						select: 'string-length($val) - 1',
						children: []
					},
					{
						type: 'variable',
						name: 'digits',
						select:
							'reverse(for $i in string-to-codepoints(substring($val, 0, $length + 1)) return $i - 48)',
						children: []
					},
					{
						type: 'variable',
						name: 'weightedSum',
						select:
							'sum(for $i in (0 to $length - 1) return $digits[$i + 1] * (1 + ((($i + 1) mod 2) * 2)))',
						children: []
					},
					{
						type: 'value-of',
						select:
							'(10 - ($weightedSum mod 10)) mod 10 = number(substring($val, $length + 1, 1))'
					}
				]
			});
			expect(XsltFunction.fromJson(json).getXqueryDefinition(sch)).toMatchSnapshot();
		});

		it('JUDE simple function using xsl:choose', () => {
			const json = parse`<function xmlns="http://www.w3.org/1999/XSL/Transform" name="local-fn:countAgeID" as="xs:integer">
			<param name="ID" as="xs:string"/>
			<choose>
				<when test="($Persons[@s:id=$ID]/nc:PersonAgeMeasure)">
					<value-of select="1"/>
				</when>
				<otherwise>
					<value-of select="0"/>
				</otherwise>
				</choose>
			</function>`;

			expect(XsltFunction.fromJson(json).getXqueryDefinition(sch)).toMatchSnapshot();
		});

		it('xsl:choose', () => {
			const json = parse`<function xmlns="http://www.w3.org/1999/XSL/Transform" name="local:test" as="xs:string">
				<choose>
					<when test="X">
						<value-of select="X"/>
					</when>
					<when test="X">
						<value-of select="X"/>
					</when>
					<otherwise>
						<value-of select="X"/>
					</otherwise>
				</choose>
			</function>`;

			expect(XsltFunction.fromJson(json).getXqueryDefinition(sch)).toMatchSnapshot();
		});

		it('xsl:for-each', () => {
			const json = parse`<function xmlns="http://www.w3.org/1999/XSL/Transform" name="local-fn:checkPresent">
				<param name="find" as="xs:string" />
				<param name="list" as="xs:string" />
				<for-each select="tokenize($find,',')">
					<if test="matches(., $list)">
						<value-of select="1" />
					</if>
				</for-each>
				<value-of select="0" />
			</function>`;

			expect(XsltFunction.fromJson(json).getXqueryDefinition(sch)).toMatchSnapshot();
		});
	});
});
