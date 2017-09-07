# node-schematron

This is an Schematron minimal syntax implementation for front- and back-end Javascript. It can be used as
a NodeJS dependency as well as in the browser (ie. wrapped by Webpack). It returns a JSON object with the (resolved)
messages of your assertions.

---

Current:

- `<rule>`
- `<pattern>`
- `<schema>`
- `<assert>`
- `<report>`
- `<name>`, with `@path`
- `<let>`, only in `<rule>`. Variables can be used in `report@test` and `assert@test`, as well as succeeding `let@value`, `name@path` (todo test).
- `<value-of>` and `@select`

Do want:
- Minimal syntax
- `<phase>`, `<active>`
- `<ns>`
- `<extends>`
- `<param>`
- `<diagnostics>`, `<diagnostic>`

Do want do:
- Reduce dependencies as a lib, but have decent functionality as CLI
- Use more of the words in the ISO/IEC 19757-3 spec
- Unit test on aspects of that spec
- Refactor the "isAssertion" and "isReport" flags