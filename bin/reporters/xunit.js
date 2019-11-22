const { sync, slimdom } = require('slimdom-sax-parser');
const { EOL } = require('os');
const { evaluateXPathToFirstNode } = require('fontoxpath');

// JUnit XSD: https://github.com/michaelleeallen/mocha-junit-reporter/blob/master/test/resources/JUnit.xsd
// See also: https://help.catchsoftware.com/display/ET/JUnit+Format

module.exports = function bindXunitReporterToEvents(req, events, stream) {
	if (!stream) {
		// Somebody obviously wants us to shut up
		return;
	}

	const document = sync(`<testsuites></testsuites>`);
	const testSuitesNode = evaluateXPathToFirstNode('//testsuites', document);

	events.on('file', (file, fileIndex) => {
		const testSuiteElement = document.createElement('testsuite');

		const totals = {
			tests: file.$value ? file.$value.length : 0,
			skipped: 0,
			failures: 0,
			errors: 0
		};

		if (file.$error) {
			++totals.errors;
			return;
		} else {
			file.$value.forEach((report) => {
				const safeMessage = report.message.replace(/\s\s+/g, '').trim();

				const testCaseElement = document.createElement('testcase');
				testCaseElement.setAttribute('classname', file.$fileNameBase);
				testCaseElement.setAttribute('name', safeMessage);

				if (report.isReport) {
					// JUnit does not seem to provide for reports, so not writing anything
					++totals.skipped;
					testCaseElement.appendChild(document.createElement('skipped'));
				} else {
					++totals.failures;
					const errorElement = document.createElement('failure');

					// A schematron assert/report may not have a unique identifier, or something else to put here
					errorElement.setAttribute('type', 'assert');

					// Attribute is not required per XSD, and we have nothing useful to add
					// errorElement.setAttribute('message', 'Assertion failed');

					testCaseElement.appendChild(errorElement);
				}

				testSuiteElement.appendChild(testCaseElement);
			});
		}

		testSuiteElement.setAttribute('errors', totals.errors);
		testSuiteElement.setAttribute('failures', totals.failures);
		testSuiteElement.setAttribute('id', fileIndex);
		testSuiteElement.setAttribute('name', file.$fileNameBase);
		testSuiteElement.setAttribute('skipped', totals.skipped);
		testSuiteElement.setAttribute('tests', totals.tests);
		testSuiteElement.setAttribute('timestamp', new Date().toISOString());

		testSuitesNode.appendChild(testSuiteElement);
	});

	events.on('end', () => stream.write(slimdom.serializeToWellFormedString(document) + EOL));
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
