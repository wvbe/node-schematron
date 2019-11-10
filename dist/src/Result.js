"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import Phase from './Phase';
// import Rule from './Rule';
// import Pattern from './Pattern';
var Result = /** @class */ (function () {
    function Result(
    // pattern: Pattern,
    // phase?: Phase,
    // rule: Rule,
    context, assert, message) {
        // this.pattern = pattern;
        // this.phase = phase;
        // this.rule = rule;
        this.isReport = assert.isReport;
        this.context = context;
        this.message = message;
    }
    Result.prototype.toJson = function () {
        return {
            isReport: this.isReport,
            context: this.context.outerHTML,
            message: this.message
        };
    };
    return Result;
}());
exports.default = Result;
//# sourceMappingURL=Result.js.map