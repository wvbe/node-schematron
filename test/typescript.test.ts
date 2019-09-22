import { sync } from 'slimdom-sax-parser';

import { Schema } from '../index';

describe('typescript', () => {
	let schema = null;

	it('compiles', () => {
		expect(typeof Schema).toBe('function');
	});

	it('parses', () => {
		schema = Schema.fromDom(sync(`<schema xmlns="http://purl.oclc.org/dsdl/schematron">
			<pattern>
				<rule context="//thunder">
					<let name="lightning" value="string(@foo)"/>
					<report test="$lightning = 'bar'"><value-of select="$lightning" /></report>
				</rule>
			</pattern>
		</schema>`));
		expect(schema).toMatchSnapshot();
	});

	it('validates', () => {
		expect(schema.validateDocument(sync(`<xml foo="err"><thunder foo="bar" /></xml>`))).toMatchSnapshot();
	});
});
