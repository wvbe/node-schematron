const { slimdom } = require('slimdom-sax-parser');
const { evaluateXPath } = require('fontoxpath');

// JUnit XSD: https://github.com/michaelleeallen/mocha-junit-reporter/blob/master/test/resources/JUnit.xsd
// See also: https://help.catchsoftware.com/display/ET/JUnit+Format

const CREATE_NODE_QUERY = `
	declare function local:generateTestSuite ($index, $file) {
		<testsuite
			id="{$index - 1}"
			errors="{$file('$errors')}"
			tests="{$file('$tests')}"
			failures="{$file('$failures')}"
		>
		{
			for $report in array:flatten($file('$value'))
				return <testcase
					classname="{$file('$fileNameBase')}"
					name="{fn:normalize-space($report('message'))}"
				>
				{ if ($report('isReport')) then () else <failure type="assert" /> }
				</testcase>
		}
		</testsuite>
	};

	<testsuites suites="{$fileCount}">
		{
			for $index in 1 to $fileCount cast as xs:int
				return local:generateTestSuite($index, $files($index))
		}
	</testsuites>
`;

module.exports = function bindXunitReporterToEvents(req, events, stream) {
	const files = [];

	events.on('file', (file) => {
		file.$tests = file.$failures = file.$skipped = file.$errors = 0;
		file.$error && ++file.$errors;
		file.$value.forEach((report) => ++file.$tests && (report.isReport ? ++file.$skipped : ++file.$failures));

		files.push(file);
	});

	events.on('end', () => {
		const variables = {
			files,
			fileCount: files.length
		};
		const options = {
			language: evaluateXPath.XQUERY_3_1_LANGUAGE,
			debug: true
		};
		const document = evaluateXPath(CREATE_NODE_QUERY, new slimdom.Document(), null, variables, null, options);

		stream.write(slimdom.serializeToWellFormedString(document));
	});
};

/*

<?xml version="1.0" encoding="UTF-8" ?>
<!-- from https://svn.jenkins-ci.org/trunk/hudson/dtkit/dtkit-format/dtkit-junit-model/src/main/resources/com/thalesgroup/dtkit/junit/model/xsd/junit-4.xsd -->
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">

    <xs:element name="failure">
        <xs:complexType mixed="true">
            <xs:attribute name="type" type="xs:string" use="optional"/>
            <xs:attribute name="message" type="xs:string" use="optional"/>
        </xs:complexType>
    </xs:element>

    <xs:element name="error">
        <xs:complexType mixed="true">
            <xs:attribute name="type" type="xs:string" use="optional"/>
            <xs:attribute name="message" type="xs:string" use="optional"/>
        </xs:complexType>
    </xs:element>

    <xs:element name="properties">
        <xs:complexType>
            <xs:sequence>
                <xs:element ref="property" maxOccurs="unbounded"/>
            </xs:sequence>
        </xs:complexType>
    </xs:element>

    <xs:element name="property">
        <xs:complexType>
            <xs:attribute name="name" type="xs:string" use="required"/>
            <xs:attribute name="value" type="xs:string" use="required"/>
        </xs:complexType>
    </xs:element>

    <xs:element name="skipped" type="xs:string"/>
    <xs:element name="system-err" type="xs:string"/>
    <xs:element name="system-out" type="xs:string"/>

    <xs:element name="testcase">
        <xs:complexType>
            <xs:sequence>
                <xs:element ref="skipped" minOccurs="0" maxOccurs="1"/>
                <xs:element ref="error" minOccurs="0" maxOccurs="unbounded"/>
                <xs:element ref="failure" minOccurs="0" maxOccurs="unbounded"/>
                <xs:element ref="system-out" minOccurs="0" maxOccurs="unbounded"/>
                <xs:element ref="system-err" minOccurs="0" maxOccurs="unbounded"/>
            </xs:sequence>
            <xs:attribute name="name" type="xs:string" use="required"/>
            <xs:attribute name="assertions" type="xs:string" use="optional"/>
            <xs:attribute name="time" type="xs:string" use="optional"/>
            <xs:attribute name="classname" type="xs:string" use="optional"/>
            <xs:attribute name="status" type="xs:string" use="optional"/>
        </xs:complexType>
    </xs:element>

    <xs:element name="testsuite">
        <xs:complexType>
            <xs:sequence>
                <xs:element ref="properties" minOccurs="0" maxOccurs="1"/>
                <xs:element ref="testcase" minOccurs="0" maxOccurs="unbounded"/>
                <xs:element ref="system-out" minOccurs="0" maxOccurs="1"/>
                <xs:element ref="system-err" minOccurs="0" maxOccurs="1"/>
            </xs:sequence>
            <xs:attribute name="name" type="xs:string" use="required"/>
            <xs:attribute name="tests" type="xs:string" use="required"/>
            <xs:attribute name="failures" type="xs:string" use="optional"/>
            <xs:attribute name="errors" type="xs:string" use="optional"/>
            <xs:attribute name="time" type="xs:string" use="optional"/>
            <xs:attribute name="disabled" type="xs:string" use="optional"/>
            <xs:attribute name="skipped" type="xs:string" use="optional"/>
            <xs:attribute name="timestamp" type="xs:string" use="optional"/>
            <xs:attribute name="hostname" type="xs:string" use="optional"/>
            <xs:attribute name="id" type="xs:string" use="optional"/>
            <xs:attribute name="package" type="xs:string" use="optional"/>
        </xs:complexType>
    </xs:element>

    <xs:element name="testsuites">
        <xs:complexType>
            <xs:sequence>
                <xs:element ref="testsuite" minOccurs="0" maxOccurs="unbounded"/>
            </xs:sequence>
            <xs:attribute name="name" type="xs:string" use="optional"/>
            <xs:attribute name="time" type="xs:string" use="optional"/>
            <xs:attribute name="tests" type="xs:string" use="optional"/>
            <xs:attribute name="failures" type="xs:string" use="optional"/>
            <xs:attribute name="disabled" type="xs:string" use="optional"/>
            <xs:attribute name="errors" type="xs:string" use="optional"/>
        </xs:complexType>
    </xs:element>

</xs:schema>
 */
