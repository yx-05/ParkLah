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
var ProbabilisticDecayCron_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProbabilisticDecayCron = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const probabilistic_vacancy_service_1 = require("../../../probabilistic/application/services/probabilistic-vacancy.service");
let ProbabilisticDecayCron = ProbabilisticDecayCron_1 = class ProbabilisticDecayCron {
    constructor(vacancyService) {
        this.vacancyService = vacancyService;
        this.logger = new common_1.Logger(ProbabilisticDecayCron_1.name);
    }
    async handleDecayTick() {
        const startTime = Date.now();
        const result = await this.vacancyService.batchDecayTick();
        const duration = Date.now() - startTime;
        this.logger.log(`[CRON:DECAY] Batch decay tick completed in ${duration}ms: ${result.updatedCount} updated, ${result.expiredCount} expired`);
        return result;
    }
};
exports.ProbabilisticDecayCron = ProbabilisticDecayCron;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ProbabilisticDecayCron.prototype, "handleDecayTick", null);
exports.ProbabilisticDecayCron = ProbabilisticDecayCron = ProbabilisticDecayCron_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [probabilistic_vacancy_service_1.ProbabilisticVacancyService])
], ProbabilisticDecayCron);
//# sourceMappingURL=probabilistic-decay.cron.js.map