"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MatchTimeoutSchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchTimeoutSchedulerService = void 0;
const common_1 = require("@nestjs/common");
const spatial_matchmaker_service_1 = require("../../../matchmaker/application/services/spatial-matchmaker.service");
let MatchTimeoutSchedulerService = MatchTimeoutSchedulerService_1 = class MatchTimeoutSchedulerService {
    constructor(matchmakerService) {
        this.matchmakerService = matchmakerService;
        this.logger = new common_1.Logger(MatchTimeoutSchedulerService_1.name);
        this.activeTimers = new Map();
    }
    scheduleHandshakeTimeout(matchId, delayMs = 15000) {
        this.cancelHandshakeTimeout(matchId);
        const timer = setTimeout(async () => {
            this.logger.warn(`[TIMEOUT] 15s Handshake expired for match [${matchId}]. Invoking timeout cascade.`);
            this.activeTimers.delete(matchId);
            try {
                await this.matchmakerService.handleHandshakeTimeout(matchId);
            }
            catch (err) {
                this.logger.error(`Error processing handshake timeout for match ${matchId}: ${err.message}`);
            }
        }, delayMs);
        this.activeTimers.set(matchId, timer);
        this.logger.log(`[TIMEOUT SCHEDULER] Scheduled 15s timeout for match [${matchId}]`);
    }
    cancelHandshakeTimeout(matchId) {
        const timer = this.activeTimers.get(matchId);
        if (timer) {
            clearTimeout(timer);
            this.activeTimers.delete(matchId);
            this.logger.log(`[TIMEOUT SCHEDULER] Cancelled timeout for match [${matchId}] (early accept/decline)`);
            return true;
        }
        return false;
    }
    getActiveTimeoutsCount() {
        return this.activeTimers.size;
    }
    clearAll() {
        for (const timer of this.activeTimers.values()) {
            clearTimeout(timer);
        }
        this.activeTimers.clear();
    }
};
exports.MatchTimeoutSchedulerService = MatchTimeoutSchedulerService;
exports.MatchTimeoutSchedulerService = MatchTimeoutSchedulerService = MatchTimeoutSchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [spatial_matchmaker_service_1.SpatialMatchmakerService])
], MatchTimeoutSchedulerService);
//# sourceMappingURL=match-timeout-scheduler.service.js.map