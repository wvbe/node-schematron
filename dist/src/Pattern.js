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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var fontoxpath_1 = require("fontoxpath");
var Variable_1 = require("./Variable");
var Rule_1 = require("./Rule");
var Pattern = /** @class */ (function () {
    function Pattern(id, rules, variables) {
        this.id = id;
        this.rules = rules;
        this.variables = variables;
    }
    Pattern.prototype.validateDocument = function (documentDom, parentVariables) {
        var _this = this;
        var variables = Variable_1.default.reduceVariables(documentDom, this.variables, __assign({}, parentVariables));
        var ruleContexts = this.rules.map(function (rule) {
            return fontoxpath_1.evaluateXPathToNodes('//(' + rule.context + ')', documentDom);
        });
        var flattenValidationResults = function (results, node) {
            var ruleIndex = ruleContexts.findIndex(function (context) { return context.includes(node); });
            var rule = ruleIndex >= 0 ? _this.rules[ruleIndex] : null;
            if (rule) {
                results.splice.apply(results, __spreadArrays([results.length, 0], rule.validateNode(node, variables)));
            }
            return node.childNodes.reduce(flattenValidationResults, results);
        };
        return documentDom.childNodes.reduce(flattenValidationResults, []);
    };
    Pattern.fromJson = function (json) {
        return new Pattern(json.id, json.rules.map(function (obj) { return Rule_1.default.fromJson(obj); }), json.variables.map(function (obj) { return Variable_1.default.fromJson(obj); }));
    };
    Pattern.QUERY = "map {\n\t\t'id': @id/string(),\n\t\t'rules': array{ ./sch:rule/" + Rule_1.default.QUERY + "},\n\t\t'variables': array { ./sch:let/" + Variable_1.default.QUERY + "}\n\t}";
    return Pattern;
}());
exports.default = Pattern;
//# sourceMappingURL=Pattern.js.map