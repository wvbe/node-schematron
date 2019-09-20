const { evaluateXPath } = require('fontoxpath');

//https://xpath.playground.fontoxml.com/?mode=1&variables=%7B%7D&xml=%0A%09%09%09%3Cschema+xmlns%3D%22http%3A%2F%2Fpurl.oclc.org%2Fdsdl%2Fschematron%22%3E%0A%09%09%09%09%3Cpattern%3E%0A%09%09%09%09%09%3Crule+context%3D%22%2F*%2Fanimal%22%3E%0A%09%09%09%09%09%09%3Clet+name%3D%22animalSpecies%22+value%3D%22species%22%2F%3E%0A%09%09%09%09%09%09%3Creport+test%3D%22count%28parent%3A%3A*%2Fanimal%5Bspecies%3D%24animalSpecies%5D%29+%26gt%3B+2%22%3E%0A%09%09%09%09%09%09There+are+more+than+two+animals+of+this+species+in+this+accommodation.%3C%2Freport%3E%0A%09%09%09%09%09%09%3Cassert+test%3D%22not%28count%28parent%3A%3A*%2Fanimal%5Bspecies%3D%24animalSpecies%5D%29+%26lt%3B+2%29%22%3E%0A%09%09%09%09%09%09There+is+no+pair+of+this+species+in+this+accommodation.%3C%2Fassert%3E%0A%09%09%09%09%09%09%3Creport+test%3D%22count%28parent%3A%3A*%2Fanimal%5Bspecies%3D%24animalSpecies%5D%29+%3D+1%22%3E%0A%09%09%09%09%09%09Is+the+only+one+of+its+species.%3C%2Freport%3E%0A%09%09%09%09%09%3C%2Frule%3E%0A%09%09%09%09%3C%2Fpattern%3E%0A%09%09%09%3C%2Fschema%3E&xpath=%09%09declare+function+local%3AserializeMessageDom%28%24node+as+node%28%29%29+%7B%0A%09%09%09array%7B%7D%0A%09%09%7D%3B%0A%09%09%09%2F*%5B1%5D%2Fmap+%7B%0A%09%09%09%09%27title%27%3A+%40title%2Fstring%28%29%2C%0A%09%09%09%09%27patterns%27%3A+array+%7B+.%2FQ%7Bhttp%3A%2F%2Fpurl.oclc.org%2Fdsdl%2Fschematron%7Dpattern%2Fmap+%7B%0A%09%09%09%09%09%27name%27%3A+%40name%2Fstring%28%29%2C%0A%09%09%09%09%09%27rules%27%3A+array%7B+.%2FQ%7Bhttp%3A%2F%2Fpurl.oclc.org%2Fdsdl%2Fschematron%7Drule%2Fmap+%7B%0A%09%09%09%09%09%09%27context%27%3A+%40context%2Fstring%28%29%2C%0A%09%09%09%09%09%09%27variables%27%3A+array+%7B+.%2FQ%7Bhttp%3A%2F%2Fpurl.oclc.org%2Fdsdl%2Fschematron%7Dlet%2Fmap+%7B%0A%09%09%09%09%09%09%09%27name%27%3A+%40name%2Fstring%28%29%2C%0A%09%09%09%09%09%09%09%27value%27%3A+%40value%2Fstring%28%29%0A%09%09%09%09%09%09%7D%7D%2C%0A%09%09%09%09%09%09%27tests%27%3A+array%7B+.%2F%28Q%7Bhttp%3A%2F%2Fpurl.oclc.org%2Fdsdl%2Fschematron%7Dreport%7CQ%7Bhttp%3A%2F%2Fpurl.oclc.org%2Fdsdl%2Fschematron%7Dassert%29%2Fmap+%7B%0A%09%09%09%09%09%09%09%27test%27%3A+%40test%2Fstring%28%29%2C%0A%09%09%09%09%09%09%09%27message%27%3A+local%3AserializeMessageDom%28.%29%2C%0A%09%09%09%09%09%09%09%27isAssertion%27%3A+boolean%28local-name%28%29+%3D+%27assert%27%29%2C%0A%09%09%09%09%09%09%09%27isReport%27%3A+boolean%28local-name%28%29+%3D+%27report%27%29%0A%09%09%09%09%09%09%7D%7D%0A%09%09%09%09%09%7D%7D%0A%09%09%09%09%7D%7D%0A%09%09%09%7D&context=

module.exports = (schematronDom, phaseIdentifier = '#DEFAULT') =>
	evaluateXPath(
		`
			declare namespace sch = 'http://purl.oclc.org/dsdl/schematron';
			declare function local:json($node as node()) {
				if ($node[self::text()])
					then $node/string()
				else
				map:merge((
					map:entry('$type', $node/name()),
					for $attr in $node/@*
						return map:entry($attr/name(), $attr/string())
				))
			};

			declare function local:getPatternsForPhase($context, $phase) {
				if ($phase = '#ALL')
					then $context/sch:pattern
					else $context/sch:pattern[@id = $context/sch:phase[@id = $phase]/sch:active/@pattern]
			};

			let $defaultPhase := if (/*/@defaultPhase) then /*/@defaultPhase/string() else '#ALL'

			return /*[1]/map {
				'title': @title/string(),
				'patterns': array { local:getPatternsForPhase(
					.,
					if ($phaseIdentifier = '#DEFAULT') then $defaultPhase else $phaseIdentifier
				)/map {
					'id': @id/string(),
					'rules': array{ ./sch:rule/map {
						'context': @context/string(),
						'variables': array { ./sch:let/map {
							'name': @name/string(),
							'value': @value/string()
						}},
						'tests': array{ ./(sch:report|sch:assert)/map {
							'test': @test/string(),
							'message': array { (./text()|./element())/local:json(.) },
							'isAssertion': boolean(local-name() = 'assert'),
							'isReport': boolean(local-name() = 'report')
						}}
					}}
				}}
			}
		`,
		schematronDom,
		null,
		{
			phaseIdentifier
		},
		null,
		{
			language: evaluateXPath.XQUERY_3_1_LANGUAGE
		}
	);
