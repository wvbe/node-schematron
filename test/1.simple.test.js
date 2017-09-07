const { getSchematronRequest, getSchematronResults, parseDom } = require('./util');

// Source of XML and Schematron samples:
// https://www.data2type.de/en/xml-xslt-xslfo/schematron/schematron-reference/

describe('1. Simplest Schematron validation', () => {
	const { patterns: [ { rules: [ firstRule ] } ] } = (schematronRequest = getSchematronRequest(
		parseDom(`
			<schema xmlns="http://purl.oclc.org/dsdl/schematron">
				<pattern>
					<rule context="//animal">
						<report test="species = 'lion' and age &gt; 3">An adult lion</report>
						<report test="species = 'elephant' and age &gt; 18">An adult elephant</report>
						<assert test="age &lt; 999">The animal is alive</assert>
					</rule>
				</pattern>
			</schema>
		`)
	));

	it('getSchematronRequest', () => expect(schematronRequest).toMatchSnapshot());

	const [ [ [ lionResult, elephantResult ] ] ] = (schematronResults = getSchematronResults(
		schematronRequest,
		parseDom(`
			<room>
				<animal sex="female" carnivore="yes">
					<species>lion</species>
					<weight>200</weight>
					<age>10</age>
				</animal>
				<animal sex="male" carnivore="no">
					<species>elephant</species>
					<weight>3000</weight>
					<age>21</age>
				</animal>
			</room>
		`)
	));

	it('getSchematronResults', () => {
		expect(lionResult).toMatchSnapshot();
		expect(elephantResult).toMatchSnapshot();
	});
});
