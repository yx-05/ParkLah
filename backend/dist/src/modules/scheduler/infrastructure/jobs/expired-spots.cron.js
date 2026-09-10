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
var ExpiredSpotsCron_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpiredSpotsCron = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const probabilistic_vacancy_service_1 = require("../../../probabilistic/application/services/probabilistic-vacancy.service");
let ExpiredSpotsCron = ExpiredSpotsCron_1 = class ExpiredSpotsCron {
    constructor(vacancyService) {
        this.vacancyService = vacancyService;
        this.logger = new common_1.Logger(ExpiredSpotsCron_1.name);
    }
    async handleExpiredPurge() {
        const expiredCount = await this.vacancyService.expireSpotsBatch();
        this.logger.log(`[CRON:PURGE] Purged ${expiredCount} expired/low-confidence spots from candidate pool`);
        return { expiredCount };
    }
};
exports.ExpiredSpotsCron = ExpiredSpotsCron;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ExpiredSpotsCron.prototype, "handleExpiredPurge", null);
exports.ExpiredSpotsCron = ExpiredSpotsCron = ExpiredSpotsCron_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [probabilistic_vacancy_service_1.ProbabilisticVacancyService])
], ExpiredSpotsCron);
//# sourceMappingURL=expired-spots.cron.js.map