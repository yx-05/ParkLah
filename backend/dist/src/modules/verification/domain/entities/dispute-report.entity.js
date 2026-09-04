"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisputeReportEntity = void 0;
const dispute_type_enum_1 = require("../enums/dispute-type.enum");
class DisputeReportEntity {
    constructor(props) {
        this.id = props.id || this.generateUuid();
        this.matchId = props.matchId || null;
        this.reporterUserId = props.reporterUserId;
        this.spotId = props.spotId || null;
        this.disputeType = props.disputeType;
        this.description = props.description || null;
        this.status = props.status || dispute_type_enum_1.DisputeStatus.PENDING;
        this.createdAt = props.createdAt || new Date();
        this.resolvedAt = props.resolvedAt || null;
    }
    resolve(auto = true) {
        this.status = auto ? dispute_type_enum_1.DisputeStatus.AUTO_RESOLVED : dispute_type_enum_1.DisputeStatus.MANUAL_REVIEW;
        this.resolvedAt = new Date();
    }
    generateUuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }
}
exports.DisputeReportEntity = DisputeReportEntity;
//# sourceMappingURL=dispute-report.entity.js.map