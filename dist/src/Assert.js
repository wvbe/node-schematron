"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fontoxpath_1 = require("fontoxpath");
var Result_1 = require("./Result");
var Assert = /** @class */ (function () {
    function Assert(test, message, isReport) {
        this.test = test;
        this.message = message;
        this.isReport = isReport;
    }
    Assert.prototype.createMessageString = function (contextNode, variables, chunks) {
        return chunks
            .map(function (chunk) {
            if (typeof chunk === 'string') {
                return chunk;
            }
            // <sch:name />
            if (chunk.$type === 'name') {
                return fontoxpath_1.evaluateXPathToString('name(' + (chunk.path || '') + ')', contextNode, null, variables);
            }
            // <sch:value-of />
            if (chunk.$type === 'value-of') {
                return fontoxpath_1.evaluateXPathToString(chunk.select, contextNode, null, variables);
            }
            console.log(chunk);
            throw new Error('Unsupported element in <sch:message>');
        })
            .join('');
    };
    Assert.prototype.validateNode = function (context, variables) {
        var outcome = fontoxpath_1.evaluateXPathToBoolean(this.test, context, null, variables);
        return (!this.isReport && outcome) || (this.isReport && !outcome)
            ? null
            : new Result_1.default(context, this, this.createMessageString(context, variables, this.message));
    };
    Assert.fromJson = function (json) {
        return new Assert(json.test, json.message, json.isReport);
    };
    Assert.QUERY = "map {\n\t\t'test': @test/string(),\n\t\t'message': array { (./text()|./element())/local:json(.) },\n\t\t'isReport': boolean(local-name() = 'report')\n\t}";
    return Assert;
}());
exports.default = Assert;
//# sourceMappingURL=Assert.js.map