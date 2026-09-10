"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisputeStatus = exports.DisputeType = void 0;
var DisputeType;
(function (DisputeType) {
    DisputeType["SPOT_TAKEN_BY_STRANGER"] = "SPOT_TAKEN_BY_STRANGER";
    DisputeType["LEAVER_DID_NOT_LEAVE"] = "LEAVER_DID_NOT_LEAVE";
    DisputeType["WRONG_LOCATION"] = "WRONG_LOCATION";
    DisputeType["SEARCHER_NO_SHOW"] = "SEARCHER_NO_SHOW";
})(DisputeType || (exports.DisputeType = DisputeType = {}));
var DisputeStatus;
(function (DisputeStatus) {
    DisputeStatus["PENDING"] = "PENDING";
    DisputeStatus["AUTO_RESOLVED"] = "AUTO_RESOLVED";
    DisputeStatus["MANUAL_REVIEW"] = "MANUAL_REVIEW";
    DisputeStatus["REJECTED"] = "REJECTED";
})(DisputeStatus || (exports.DisputeStatus = DisputeStatus = {}));
//# sourceMappingURL=dispute-type.enum.js.map