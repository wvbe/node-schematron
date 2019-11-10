"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Variable_1 = require("./Variable");
var Phase = /** @class */ (function () {
    function Phase(id, active, variables) {
        this.id = id;
        this.active = active;
        this.variables = variables;
    }
    Phase.fromJson = function (json) {
        return new Phase(json.id, json.active, json.variables.map(function (rule) { return Variable_1.default.fromJson(rule); }));
    };
    Phase.QUERY = "map {\n\t\t\"id\": @id/string(),\n\t\t\"active\": array { ./sch:active/@pattern/string() },\n\t\t'variables': array { ./sch:let/" + Variable_1.default.QUERY + "}\n\t}";
    return Phase;
}());
exports.default = Phase;
//# sourceMappingURL=Phase.js.map