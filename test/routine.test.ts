import { Schema } from '../src/index';

describe('Validation routine', () => {
	const schema = Schema.fromString(
		`<schema xmlns="http://purl.oclc.org/dsdl/schematron">
			<pattern>
				<rule context="thunder[@foo]">
					<report test="true()">Report 1a</report>
					<report test="false()">Report 1x</report>
					<report test="true()">Report 1b</report>
				</rule>
				<rule context="thunder">
					<report test="true()">Report 2</report>
				</rule>
				<rule context="thunder[@foo='bar']">
					<report test="true()">Report 3</report>
				</rule>
			</pattern>
		</schema>`
	);

	it('Includes report on all asserts from a rule', () => {
		const results = schema.validateString(`<xml foo="err">
			<thunder />
			<thunder foo="bar" />
		</xml>`);
		expect(results).toHaveLength(3);
		expect(results[0].message).toBe('Report 2');
		expect(results[1].message).toBe('Report 1a');
		expect(results[2].message).toBe('Report 1b');
	});

	it('In order of nodes', () => {
		const results = schema.validateString(`<xml foo="err">
			<thunder foo="bar" />
			<thunder />
		</xml>`);
		expect(results).toHaveLength(3);
		expect(results[0].message).toBe('Report 1a');
		expect(results[2].message).toBe('Report 2');
	});

	it('Derp', () => {
		const results = schema.validateString(`<xml foo="err">
			<thunder foo="bar" />
			<thunder />
		</xml>`);
		expect(results.filter(r => r.message === 'Report 3')).toHaveLength(0);
	});
});
