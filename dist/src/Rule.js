"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var Variable_1 = require("./Variable");
var Assert_1 = require("./Assert");
var Rule = /** @class */ (function () {
    function Rule(context, variables, asserts) {
        this.context = context;
        this.variables = variables;
        this.asserts = asserts;
    }
    Rule.prototype.validateNode = function (context, parentVariables) {
        var variables = Variable_1.default.reduceVariables(context, this.variables, __assign({}, parentVariables));
        return this.asserts
            .map(function (assert) { return assert.validateNode(context, variables); })
            .filter(function (result) { return !!result; });
    };
    Rule.fromJson = function (json) {
        var variables = json.variables.map(function (rule) { return Variable_1.default.fromJson(rule); });
        var asserts = json.asserts.map(function (rule) { return Assert_1.default.fromJson(rule); });
        return new Rule(json.context, variables, asserts);
    };
    Rule.QUERY = "map {\n\t\t'context': @context/string(),\n\t\t'variables': array { ./sch:let/" + Variable_1.default.QUERY + "},\n\t\t'asserts': array{ ./(sch:report|sch:assert)/" + Assert_1.default.QUERY + "}\n\t}";
    return Rule;
}());
exports.default = Rule;
//# sourceMappingURL=Rule.js.map