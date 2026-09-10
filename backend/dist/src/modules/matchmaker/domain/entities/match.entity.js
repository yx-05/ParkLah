"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchEntity = void 0;
const match_status_enum_1 = require("../enums/match-status.enum");
const exceptions_1 = require("../../../../common/exceptions");
class MatchEntity {
    constructor(props) {
        this.id = props.id || this.generateUuid();
        this.searcherId = props.searcherId;
        this.leaverId = props.leaverId || null;
        this.probabilisticSpotId = props.probabilisticSpotId || null;
        this.matchType = props.matchType || (props.leaverId ? 'REAL_TIME_P2P' : 'PROBABILISTIC_DB');
        this.spotLatitude = props.spotLatitude;
        this.spotLongitude = props.spotLongitude;
        this.status = props.status || match_status_enum_1.MatchStatus.OFFERED;
        this.searcherChargeAmount = props.searcherChargeAmount !== undefined ? props.searcherChargeAmount : 0.50;
        this.leaverRewardAmount = props.leaverRewardAmount !== undefined ? props.leaverRewardAmount : 0.25;
        this.platformFeeAmount = props.platformFeeAmount !== undefined ? props.platformFeeAmount : 0.25;
        this.handshakeTimeoutSeconds = props.handshakeTimeoutSeconds || 15;
        this.offeredAt = props.offeredAt || new Date();
        this.acceptedAt = props.acceptedAt || null;
        this.arrivedAt = props.arrivedAt || null;
        this.completedAt = props.completedAt || null;
        this.cancelledAt = props.cancelledAt || null;
        this.cancellationReason = props.cancellationReason || null;
    }
    accept() {
        if (this.status !== match_status_enum_1.MatchStatus.OFFERED) {
            throw new exceptions_1.ValidationException(`Cannot accept match with status ${this.status}`);
        }
        this.status = match_status_enum_1.MatchStatus.ACCEPTED;
        this.acceptedAt = new Date();
    }
    markEnRoute() {
        this.status = match_status_enum_1.MatchStatus.EN_ROUTE;
    }
    markArrived() {
        this.status = match_status_enum_1.MatchStatus.ARRIVED;
        this.arrivedAt = new Date();
    }
    markCompleted() {
        this.status = match_status_enum_1.MatchStatus.COMPLETED;
        this.completedAt = new Date();
    }
    markFailedSpotTaken() {
        this.status = match_status_enum_1.MatchStatus.FAILED_SPOT_TAKEN;
        this.completedAt = new Date();
    }
    markTimeout() {
        if (this.status === match_status_enum_1.MatchStatus.OFFERED) {
            this.status = match_status_enum_1.MatchStatus.TIMEOUT;
            this.cancelledAt = new Date();
            this.cancellationReason = 'HANDSHAKE_TIMEOUT_15S';
        }
    }
    markDeclined() {
        if (this.status === match_status_enum_1.MatchStatus.OFFERED) {
            this.status = match_status_enum_1.MatchStatus.DECLINED;
            this.cancelledAt = new Date();
            this.cancellationReason = 'DECLINED_BY_SEARCHER';
        }
    }
    cancel(reason, by) {
        this.status = by === 'SEARCHER' ? match_status_enum_1.MatchStatus.CANCELLED_SEARCHER : match_status_enum_1.MatchStatus.CANCELLED_LEAVER;
        this.cancelledAt = new Date();
        this.cancellationReason = reason;
    }
    generateUuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }
}
exports.MatchEntity = MatchEntity;
//# sourceMappingURL=match.entity.js.map