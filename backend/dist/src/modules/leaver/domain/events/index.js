"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaverCancelledEvent = exports.LeaverBroadcastedEvent = void 0;
class LeaverBroadcastedEvent {
    constructor(leaverId, coordinates, countdownSeconds, vehicleSummary, landmarkNote, timestamp = new Date()) {
        this.leaverId = leaverId;
        this.coordinates = coordinates;
        this.countdownSeconds = countdownSeconds;
        this.vehicleSummary = vehicleSummary;
        this.landmarkNote = landmarkNote;
        this.timestamp = timestamp;
    }
}
exports.LeaverBroadcastedEvent = LeaverBroadcastedEvent;
class LeaverCancelledEvent {
    constructor(leaverId, reason, remainingSeconds, isMatched, timestamp = new Date()) {
        this.leaverId = leaverId;
        this.reason = reason;
        this.remainingSeconds = remainingSeconds;
        this.isMatched = isMatched;
        this.timestamp = timestamp;
    }
}
exports.LeaverCancelledEvent = LeaverCancelledEvent;
//# sourceMappingURL=index.js.map