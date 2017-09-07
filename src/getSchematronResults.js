const { evaluateXPath, evaluateXPathToBoolean, evaluateXPathToNodes, evaluateXPathToString } = require('fontoxpath');

function serializeRuleMessagePart(context, variables, piece) {
	if (typeof piece === 'string') {
		return piece;
	}

	if (piece.$type === 'name') {
		return evaluateXPathToString('name(' + (piece.path || '') + ')', context, null, variables);
	}
	if (piece.$type === 'value-of') {
		return evaluateXPathToString(piece.select, context, null, variables);
	}

	console.log(piece);
	throw new Error('Unsupported element in <sch:message>');
}

module.exports = (schematronRequest, documentDom) => {
	return schematronRequest.patterns.map((pattern) =>
		pattern.rules.map((rule) =>
			evaluateXPathToNodes(rule.context, documentDom, null).map((context) => {
				const variables = rule.variables.reduce(
					(mapping, variable) =>
						Object.assign(mapping, {
							[variable.name]: variable.value
								? evaluateXPath(variable.value, context, null, mapping)
								: context
						}),
					{}
				);
				return {
					context: context,
					results: rule.tests.map((res) => {
						const outcome = evaluateXPathToBoolean(res.test, context, null, variables);
						if ((res.isReport && !outcome) || (res.isAssertion && outcome)) {
							// These outcomes normally mean that a schematron engine does _not_ log a result here.
							// Returning null here allows us to map all other results back to the original schematron
							// assert later
							return null;
						}

						const message = res.message.map(serializeRuleMessagePart.bind(undefined, context, variables));
						return message.join('');
					})
				};
			})
		)
	);
};
