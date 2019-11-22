"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Namespace = /** @class */ (function () {
    function Namespace(prefix, uri) {
        this.prefix = prefix;
        this.uri = uri;
    }
    Namespace.fromJson = function (json) {
        return new Namespace(json.prefix, json.uri);
    };
    Namespace.QUERY = "map {\n\t\t\"prefix\": @prefix/string(),\n\t\t\"uri\": @uri/string()\n\t}";
    return Namespace;
}());
exports.default = Namespace;
//# sourceMappingURL=Namespace.js.map