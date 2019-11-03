# node-schematron

This is an Schematron minimal syntax implementation for front- and back-end Javascript. It can be used as
a NodeJS dependency as well as in the browser (ie. wrapped by Webpack). It returns a JSON object with the (resolved)
messages of your assertions.

#### To use

To use programmatically, install to your project like any other npm module: `npm install node-schematron`

```
const { Schema } = require('node-schematron');

const schema = Schema.fromString(`<schema xmlns="http://purl.oclc.org/dsdl/schematron">
	<pattern>
		<rule context="thunder">
			<let name="lightning"/>
			<report test="$lightning/@foo = 'bar'">
				Skeet boop <value-of select="$lightning/@foo" />
			</report>
		</rule>
	</pattern>
</schema>`);

const results = schema.validateString(`<xml foo="err">
	<thunder foo="bar" />
</xml>`);
```

To use as a command in your terminal, install globally like: `npm install -g node-schematron`

```
/Users/Wybe/Docs/schematron-test:
	node-schematron my-schema.sch my-document.xml
```

#### Bucket list

-   Reduce dependencies as a lib, but have decent functionality as CLI
-   Use more of the words in the ISO/IEC 19757-3 spec
-   Unit test on aspects of that spec

#### Conformance

I'm working through the [ISO/IEC 19757-3:2016](./docs/c055982_ISO_IEC_19757-3_2016.pdf) document in an attempt to implement Schematron faithfully. The unit tests are the authority of which parts of the spec are guaranteed to work.

From section 5.4.3 "Core elements" is currently _not_ supported:

-   Elements `<extends>`, `<include>` and `<param>`
-   Attributes `@abstract`, `@diagnostics`, `@icon`, `@see`, `@fpi`, `@flag`, `@role` and `@subject`

#### Non-conformance

-   I have no aspiration towards "A full-conformance implementation shall be able to determine for any XML
    document whether it is a correct schema." because I do not find it useful. Pull-requests, however, are welcome.
-   I'll probably not implement rich documentation elements like <p> and <emph> because it does not fit well with
    Javascript oriented use that I imagine for myself. Pull-requests are welcome.
