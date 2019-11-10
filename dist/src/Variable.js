"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fontoxpath_1 = require("fontoxpath");
var Variable = /** @class */ (function () {
    function Variable(name, value) {
        this.name = name;
        this.value = value;
    }
    Variable.reduceVariables = function (context, variables, initial) {
        return variables.reduce(function (mapping, variable) {
            var _a;
            return Object.assign(mapping, (_a = {},
                _a[variable.name] = variable.value
                    ? fontoxpath_1.evaluateXPath(variable.value, context, null, mapping)
                    : context,
                _a));
        }, initial || {});
    };
    Variable.fromJson = function (json) {
        return new Variable(json.name, json.value);
    };
    Variable.QUERY = "map {\n\t\t'name': @name/string(),\n\t\t'value': @value/string()\n\t}";
    return Variable;
}());
exports.default = Variable;
//# sourceMappingURL=Variable.js.map