"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Ns = /** @class */ (function () {
    function Ns(prefix, uri) {
        this.prefix = prefix;
        this.uri = uri;
    }
    Ns.fromJson = function (json) {
        return new Ns(json.prefix, json.uri);
    };
    Ns.QUERY = "map {\n\t\t\"prefix\": @prefix/string(),\n\t\t\"uri\": @uri/string()\n\t}";
    return Ns;
}());
exports.default = Ns;
//# sourceMappingURL=Ns.js.map