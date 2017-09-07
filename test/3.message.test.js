const { getSchematronRequest, getSchematronResults, parseDom } = require('./util');

// Source of XML and Schematron samples:
// https://www.data2type.de/en/xml-xslt-xslfo/schematron/schematron-reference/

describe('3. Message formatting', () => {
	it('<name>', () => {
		const { patterns: [ { rules: [ { tests: [ weightReport ] } ] } ] } = (schematronRequest = getSchematronRequest(
			parseDom(`
		  <schema xmlns="http://purl.oclc.org/dsdl/schematron">
			  <pattern>
				  <rule context="/*/*">
					  <report test="weight &gt;= max(../*/weight)">
					  This is the heaviest <name /> in the <name path="parent::*" /></report>
				  </rule>
			  </pattern>
		  </schema>
	  `)
		));

		expect(weightReport).toMatchSnapshot();

		const [ [ [ ponyResult, lionResult, otterResult ] ] ] = (schematronResults = getSchematronResults(
			schematronRequest,
			parseDom(`
		  <jungle xmlns="http://dummy">
			  <animal sex="female" carnivore="no">
				  <species>pony</species>
				  <weight>180</weight>
				  <age>5</age>
			  </animal>
			  <animal sex="male" carnivore="yes">
				  <species>lion</species>
				  <weight>200</weight>
				  <age>30</age>
			  </animal>
			  <animal sex="male" carnivore="no">
				  <species>otter</species>
				  <weight>6</weight>
				  <age>23</age>
			  </animal>
		  </jungle>
	  `)
		));

		expect(ponyResult.results[0]).toBe(null);
		expect(lionResult.results[0]).toMatch('heaviest animal in the jungle');
		expect(otterResult.results[0]).toBe(null);

		expect(schematronResults).toMatchSnapshot();
	});

	it('<value-of>', () => {
		const { patterns: [ { rules: [ { tests: [ weightReport ] } ] } ] } = (schematronRequest = getSchematronRequest(
			parseDom(`
		  <schema xmlns="http://purl.oclc.org/dsdl/schematron">
			  <pattern>
				  <rule context="/*/*">
					  <report test="true()">
					  This animal is <value-of select="weight" /> kilos heavy!</report>
				  </rule>
			  </pattern>
		  </schema>
	  `)
		));

		expect(weightReport).toMatchSnapshot();

		const [ [ [ ponyResult ] ] ] = (schematronResults = getSchematronResults(
			schematronRequest,
			parseDom(`
		  <jungle xmlns="http://dummy">
			  <animal sex="female" carnivore="no">
				  <species>pony</species>
				  <weight>180</weight>
				  <age>5</age>
			  </animal>
		  </jungle>
	  `)
		));

		expect(ponyResult.results[0]).toMatch('is 180 kilos heavy!');

		expect(schematronResults).toMatchSnapshot();
	});
});
