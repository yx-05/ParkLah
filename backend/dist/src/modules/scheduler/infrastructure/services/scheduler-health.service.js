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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulerHealthService = void 0;
const common_1 = require("@nestjs/common");
const match_timeout_scheduler_service_1 = require("../../application/services/match-timeout-scheduler.service");
let SchedulerHealthService = class SchedulerHealthService {
    constructor(timeoutScheduler) {
        this.timeoutScheduler = timeoutScheduler;
    }
    getSchedulerMetrics() {
        return {
            status: 'UP',
            activeTimeoutJobs: this.timeoutScheduler.getActiveTimeoutsCount(),
            decayCronStatus: 'ACTIVE_60S',
            purgeCronStatus: 'ACTIVE_60S',
            timestamp: new Date().toISOString(),
        };
    }
};
exports.SchedulerHealthService = SchedulerHealthService;
exports.SchedulerHealthService = SchedulerHealthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [match_timeout_scheduler_service_1.MatchTimeoutSchedulerService])
], SchedulerHealthService);
//# sourceMappingURL=scheduler-health.service.js.map