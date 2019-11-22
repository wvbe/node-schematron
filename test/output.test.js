import { Schema } from '../index';

const SCHEMATRON_EXAMPLE = `<schema xmlns="http://purl.oclc.org/dsdl/schematron">
	<ns prefix="drp" uri="http://derp" />
	<pattern>
		<rule context="drp:thunder[@foo]">
			<report test="true()">
				A report that always fires <name /> for any foo
			</report>
			<report test="false()" id="fires-never">
				A report that never fires <name /> for any foo
			</report>
			<assert test="not(@foo = 'bar' and not(preceding-sibling::*))" id="foobar-1st-child">
				An assert that fails once out of three times
			</assert>
		</rule>
		<rule context="drp:thunder">
			<assert test="@foo = 'bar'" id="fires-always">
				An assert that applies to only one element and always fails
			</assert>
		</rule>
	</pattern>
</schema>`;

const DOCUMENT_EXAMPLE = `<xml xmlns="http://derp" foo="err">
	<thunder />
	<thunder foo="unbar">
		<thunder foo="bar" />
	</thunder>
	<thunder foo="bar" />
</xml>`;

describe('Output', () => {
	const schema = Schema.fromString(SCHEMATRON_EXAMPLE.replace(/\t|\n/g, ''));
	const results = schema.validateString(DOCUMENT_EXAMPLE.replace(/\t|\n/g, ''));

	it('Schema.fromString(SCHEMATRON_EXAMPLE)', () => {
		expect(schema).toMatchSnapshot();
	});

	it('schema.validateString(DOCUMENT_EXAMPLE)', () => {
		expect(results).toMatchSnapshot();
	});
});
