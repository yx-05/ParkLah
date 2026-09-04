"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackgroundSchedulerModule = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const probabilistic_decay_cron_1 = require("./infrastructure/jobs/probabilistic-decay.cron");
const expired_spots_cron_1 = require("./infrastructure/jobs/expired-spots.cron");
const match_timeout_scheduler_service_1 = require("./application/services/match-timeout-scheduler.service");
const scheduler_health_service_1 = require("./infrastructure/services/scheduler-health.service");
const probabilistic_vacancy_module_1 = require("../probabilistic/probabilistic-vacancy.module");
const spatial_matchmaker_module_1 = require("../matchmaker/spatial-matchmaker.module");
let BackgroundSchedulerModule = class BackgroundSchedulerModule {
};
exports.BackgroundSchedulerModule = BackgroundSchedulerModule;
exports.BackgroundSchedulerModule = BackgroundSchedulerModule = __decorate([
    (0, common_1.Module)({
        imports: [
            schedule_1.ScheduleModule.forRoot(),
            probabilistic_vacancy_module_1.ProbabilisticVacancyModule,
            spatial_matchmaker_module_1.SpatialMatchmakerModule,
        ],
        providers: [
            probabilistic_decay_cron_1.ProbabilisticDecayCron,
            expired_spots_cron_1.ExpiredSpotsCron,
            match_timeout_scheduler_service_1.MatchTimeoutSchedulerService,
            scheduler_health_service_1.SchedulerHealthService,
        ],
        exports: [
            probabilistic_decay_cron_1.ProbabilisticDecayCron,
            expired_spots_cron_1.ExpiredSpotsCron,
            match_timeout_scheduler_service_1.MatchTimeoutSchedulerService,
            scheduler_health_service_1.SchedulerHealthService,
        ],
    })
], BackgroundSchedulerModule);
//# sourceMappingURL=background-scheduler.module.js.map