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
var fontoxpath_1 = require("fontoxpath");
var slimdom_sax_parser_1 = require("slimdom-sax-parser");
var Variable_1 = require("./Variable");
var Phase_1 = require("./Phase");
var Pattern_1 = require("./Pattern");
var Schema = /** @class */ (function () {
    function Schema(title, defaultPhase, variables, phases, patterns) {
        this.title = title;
        this.defaultPhase = defaultPhase;
        this.variables = variables;
        this.phases = phases;
        this.patterns = patterns;
    }
    Schema.prototype.validateString = function (documentXmlString, phaseId) {
        return this.validateDocument(slimdom_sax_parser_1.sync(documentXmlString), phaseId);
    };
    Schema.prototype.validateDocument = function (documentDom, phaseId) {
        var _this = this;
        if (!phaseId) {
            phaseId = '#DEFAULT';
        }
        if (phaseId === '#DEFAULT') {
            phaseId = this.defaultPhase || '#ALL';
        }
        var variables = Variable_1.default.reduceVariables(documentDom, this.variables, {});
        if (phaseId === '#ALL') {
            return this.patterns
                .reduce(function (results, pattern) { return results.concat(pattern.validateDocument(documentDom, variables)); }, []);
        }
        var phase = this.phases.find(function (phase) { return phase.id === phaseId; });
        var phaseVariables = Variable_1.default.reduceVariables(documentDom, phase.variables, __assign({}, variables));
        return phase.active
            .map(function (patternId) { return _this.patterns.find(function (pattern) { return pattern.id === patternId; }); })
            .reduce(function (results, pattern) { return results.concat(pattern.validateDocument(documentDom, phaseVariables)); }, []);
    };
    Schema.fromJson = function (json) {
        return new Schema(json.title, json.defaultPhase, json.variables.map(function (obj) { return Variable_1.default.fromJson(obj); }), json.phases.map(function (obj) { return Phase_1.default.fromJson(obj); }), json.patterns.map(function (obj) { return Pattern_1.default.fromJson(obj); }));
    };
    Schema.fromString = function (schematronXmlString) {
        return Schema.fromDom(slimdom_sax_parser_1.sync(schematronXmlString));
    };
    Schema.fromDom = function (schematronDom) {
        return Schema.fromJson(Schema.fromDomToJson(schematronDom));
    };
    Schema.fromDomToJson = function (schematronDom) {
        return fontoxpath_1.evaluateXPath("\n\t\t\t\tdeclare namespace sch = 'http://purl.oclc.org/dsdl/schematron';\n\n\t\t\t\tdeclare function local:json($node as node()) {\n\t\t\t\t\tif ($node[self::text()])\n\t\t\t\t\t\tthen $node/string()\n\t\t\t\t\telse\n\t\t\t\t\tmap:merge((\n\t\t\t\t\t\tmap:entry('$type', $node/name()),\n\t\t\t\t\t\tfor $attr in $node/@*\n\t\t\t\t\t\t\treturn map:entry($attr/name(), $attr/string())\n\t\t\t\t\t))\n\t\t\t\t};\n\n\t\t\t\tlet $context := /*[1]\n\t\t\t\treturn map {\n\t\t\t\t\t'title': $context/@title/string(),\n\t\t\t\t\t'defaultPhase': $context/@defaultPhase/string(),\n\t\t\t\t\t'phases': array { $context/sch:phase/" + Phase_1.default.QUERY + "},\n\t\t\t\t\t'patterns': array { $context/sch:pattern/" + Pattern_1.default.QUERY + "},\n\t\t\t\t\t'variables': array { $context/sch:let/" + Variable_1.default.QUERY + "}\n\t\t\t\t}\n\t\t\t", schematronDom, null, {}, null, { language: fontoxpath_1.evaluateXPath.XQUERY_3_1_LANGUAGE });
    };
    return Schema;
}());
exports.default = Schema;
//# sourceMappingURL=Schema.js.map