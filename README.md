# node-schematron

This is an Schematron minimal syntax implementation for front- and back-end Javascript. It can be used as
a NodeJS dependency as well as in the browser (ie. wrapped by Webpack). It returns a JSON object with the (resolved)
messages of your assertions.

## To use programmatically

To use programmatically, install to your project like any other npm module: `npm install node-schematron`

```js
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

const results = schema.validateString(
	`<xml foo="err">
	<thunder foo="bar" />
</xml>`,
	{ debug: true }
);

// results === [
//   {
//      isReport: true,
//      context: <thunder foo="bar" />,
//      message: '\n\t\t\t\tSkeet boop bar\n\t\t\t'
//   }
// ]
```

## To use from command line

To use as a command in your terminal, install globally like: `npm install -g node-schematron`. Alternatively, you can
use `npx` to run it.

The `node-schematron` command has two parameters, the last one of which is optional:

1. `schematronLocation`, required, an absolute path or relative reference to your schematron XML. For example
   `my-schema.sch`.
2. `globPattern`, optional, a globbing pattern for documents. For example `*.{xml,dita}` (all .xml and .dita files).
   Defaults to `*.xml` (all .xml files in the current working directory).

```sh
/Users/Wybe/Docs/schematron-test:
  node-schematron my-schema.sch
  # Gives the results for all "*.xml" files in this directory
```

```sh
/Users/Wybe/Docs/schematron-test:
  node-schematron my-schema "docs/**/*.xml"
  # Gives the results for all "*.xml" files in the docs/ directory and all subdirectories
```

Besides that you can give it a fair amount of options:

| Long name     | Short | Description                                                                                                                                                                         |
| ------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--reporters` | `-r`  | The reporter(s) to use. Zero or many of `npm` or `xunit`, space separated.                                                                                                          |
| `--ok`        | `-o`  | Do not exit process with an error code if at least one document fails a schematron assertion.                                                                                       |
| `--debug`     | `-D`  | Display extra stack trace information in case of XPath errors                                                                                                                       |
| `--files`     | `-f`  | A list of files, in case you can't use the globbing parameter.                                                                                                                      |
| `--batch`     | `-b`  | The number of documents to handle before opening the next child process. Defaults to `5000`.                                                                                        |
| `--phase`     | `-p`  | The schematron phase to run. Defaults to `#DEFAULT` (which means the `@defaultPhase` value or `#ALL`.                                                                               |
| `--log-level` | `-l`  | The amount of stuff to log. Only used if `-r` includes `npm`. Value must be one of `silly`, `info`, `report`, `pass`, `assert`, `fail`, `fileError` or `error`. Defaults to `info`. |

```sh
/Users/Wybe/Docs/schematron-test:
  node-schematron my-schema.sch "**/*.xml" --phase publication --log-level fail
  # Validates the "publication" phase and logs only the paths of documents that fail
```

```sh
/Users/Wybe/Docs/schematron-test:
  node-schematron my-schema.sch "**/*.xml" -r xunit > test-reports/test-report.xml
  # Validates the "publication" phase and writes an XUnit XML report to file
```

## Custom functions

`node-schematron` comes with limited support for `<xsl:function>` elements. Simple use cases of `xsl:function`,
`xsl:param`, `xsl:if`, `xsl:choose`, `xsl:for-each`, `xsl:variable` and `xsl:value-of` work. This partial implementation
of XSLT is not tested against the spec, and should be considered experimental.

```xml
<schema xmlns="http://purl.oclc.org/dsdl/schematron">
	<ns uri="http://example.com" prefix="example" />
	<function xmlns="http://www.w3.org/1999/XSL/Transform" name="example:is-foo" as="xs:boolean">
		<param name="input" as="xs:string"/>
		<value-of select="$input = 'foo'"/>
	</function>
	<!-- ... -->
</schema>

```

Custom functions can also be implemented through `fontoxpath`'s Javascript API. This may be helpful for introducing
functions that are not already supported by `fontxpath` already. To define custom XPath functions, import
`registerCustomXPathFunction`:

```js
const { registerCustomXPathFunction } = require('node-schematron');

registerCustomXPathFunction(
	{
		localName: 'is-foo',
		namespaceURI: 'http://example.com'
	},
	['xs:string?'],
	'xs:boolean',
	(domFacade, input) => input === 'foo'
);
```

The `registerCustomXPathFunction` is an alias for the same function in `fontoxpath`. See the
[fontoxpath "global functions" documentation](https://github.com/FontoXML/fontoxpath#global-functions) for more
information.

## Compliance

As for features, check out the unit tests in `test/`. I've mirrored them to the text of [ISO/IEC 19757-3 2016](./docs/c055982_ISO_IEC_19757-3_2016.pdf) in order to clearly assert how far `node-schematron` is up to spec.
I've also noticed there's different ways you can read that text, so please file an issue if you feel `node-schematron`
behaves in a non-standard or buggy way.

| Section | Thing          | Status         |
| ------- | -------------- | -------------- |
| 5.4.1   | `<active />`   | Tests OK       |
| 5.4.1   | `<active />`   | Tests OK       |
| 5.4.2   | `<assert />`   | Tests OK       |
| 5.4.3   | `<extends />`  | Not on roadmap |
| 5.4.4   | `<include />`  | Not on roadmap |
| 5.4.5   | `<let />`      | Tests OK       |
| 5.4.6   | `<name />`     | Tests OK       |
| 5.4.7   | `<ns />`       | Experimental   |
| 5.4.8   | `<param />`    | Tests OK       |
| 5.4.9   | `<pattern />`  | Tests OK       |
| 5.4.10  | `<phase />`    | Tests OK       |
| 5.4.11  | `<report />`   | Tests OK       |
| 5.4.12  | `<rule />`     | Tests OK       |
| 5.4.13  | `<schema />`   | Tests OK       |
| 5.4.14  | `<value-of />` | Tests OK       |

Not supported attributes are `@abstract`, `@diagnostics`, `@icon`, `@see`, `@fpi`, `@flag`, `@role` and `@subject`.

## Support

-   Every pull request will be considered and responded to.
-   The schematron query language is XPath 3.1, implemented by [fontoxpath](https://www.npmjs.com/package/fontoxpath). It
    is [not yet feature complete](https://documentation.fontoxml.com/editor/latest/xpath-25591894.html).

# FAQ

- **Are XSLT functions (`<xsl:function>`) supported?** No, unfortunately not. There is a feature branch (
  `xslt-functions`) with a naive implementation that unfortunately got stuck. More about that problem in
  [this closing comment in a related ticket](https://github.com/wvbe/node-schematron/issues/1#issuecomment-873554478).

## License

Copyright (c) 2019 Wybe Minnebo

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit
persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
Software.

**THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.**
