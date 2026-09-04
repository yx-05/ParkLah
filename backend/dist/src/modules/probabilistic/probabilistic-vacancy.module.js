"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProbabilisticVacancyModule = void 0;
const common_1 = require("@nestjs/common");
const probabilistic_vacancy_service_1 = require("./application/services/probabilistic-vacancy.service");
const decay_engine_1 = require("./domain/services/decay.engine");
const probabilistic_spot_controller_1 = require("./infrastructure/controllers/probabilistic-spot.controller");
const probabilistic_spot_repository_port_1 = require("./domain/ports/probabilistic-spot-repository.port");
const postgres_probabilistic_spot_repository_1 = require("./infrastructure/adapters/postgres-probabilistic-spot.repository");
const in_memory_probabilistic_spot_repository_1 = require("./infrastructure/adapters/in-memory-probabilistic-spot.repository");
const auth_module_1 = require("../auth/auth.module");
let ProbabilisticVacancyModule = class ProbabilisticVacancyModule {
};
exports.ProbabilisticVacancyModule = ProbabilisticVacancyModule;
exports.ProbabilisticVacancyModule = ProbabilisticVacancyModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule],
        controllers: [probabilistic_spot_controller_1.ProbabilisticSpotController],
        providers: [
            probabilistic_vacancy_service_1.ProbabilisticVacancyService,
            decay_engine_1.DecayEngine,
            {
                provide: probabilistic_spot_repository_port_1.PROBABILISTIC_SPOT_REPOSITORY_PORT,
                useFactory: () => {
                    return process.env.DATABASE_URL
                        ? new postgres_probabilistic_spot_repository_1.PostgresProbabilisticSpotRepository()
                        : new in_memory_probabilistic_spot_repository_1.InMemoryProbabilisticSpotRepository();
                },
            },
        ],
        exports: [
            probabilistic_vacancy_service_1.ProbabilisticVacancyService,
            decay_engine_1.DecayEngine,
            probabilistic_spot_repository_port_1.PROBABILISTIC_SPOT_REPOSITORY_PORT,
        ],
    })
], ProbabilisticVacancyModule);
//# sourceMappingURL=probabilistic-vacancy.module.js.map