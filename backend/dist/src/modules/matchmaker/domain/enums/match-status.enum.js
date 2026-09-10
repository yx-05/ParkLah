"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchStatus = void 0;
var MatchStatus;
(function (MatchStatus) {
    MatchStatus["OFFERED"] = "OFFERED";
    MatchStatus["ACCEPTED"] = "ACCEPTED";
    MatchStatus["EN_ROUTE"] = "EN_ROUTE";
    MatchStatus["ARRIVED"] = "ARRIVED";
    MatchStatus["COMPLETED"] = "COMPLETED";
    MatchStatus["FAILED_SPOT_TAKEN"] = "FAILED_SPOT_TAKEN";
    MatchStatus["CANCELLED_SEARCHER"] = "CANCELLED_SEARCHER";
    MatchStatus["CANCELLED_LEAVER"] = "CANCELLED_LEAVER";
    MatchStatus["TIMEOUT"] = "TIMEOUT";
    MatchStatus["DECLINED"] = "DECLINED";
})(MatchStatus || (exports.MatchStatus = MatchStatus = {}));
//# sourceMappingURL=match-status.enum.js.map