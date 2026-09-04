"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpatialMatchmakerModule = void 0;
const common_1 = require("@nestjs/common");
const spatial_matchmaker_service_1 = require("./application/services/spatial-matchmaker.service");
const match_scoring_engine_1 = require("./domain/services/match-scoring.engine");
const candidate_discovery_service_1 = require("./infrastructure/services/candidate-discovery.service");
const matchmaker_controller_1 = require("./infrastructure/controllers/matchmaker.controller");
const match_repository_port_1 = require("./domain/ports/match-repository.port");
const distributed_lock_port_1 = require("./domain/ports/distributed-lock.port");
const postgres_match_repository_1 = require("./infrastructure/adapters/postgres-match.repository");
const redis_lock_adapter_1 = require("./infrastructure/adapters/redis-lock.adapter");
const in_memory_match_repository_1 = require("./infrastructure/adapters/in-memory-match.repository");
const in_memory_lock_adapter_1 = require("./infrastructure/adapters/in-memory-lock.adapter");
const gatekeeper_module_1 = require("../gatekeeper/gatekeeper.module");
const probabilistic_vacancy_module_1 = require("../probabilistic/probabilistic-vacancy.module");
const gateway_module_1 = require("../gateway/gateway.module");
const auth_module_1 = require("../auth/auth.module");
let SpatialMatchmakerModule = class SpatialMatchmakerModule {
};
exports.SpatialMatchmakerModule = SpatialMatchmakerModule;
exports.SpatialMatchmakerModule = SpatialMatchmakerModule = __decorate([
    (0, common_1.Module)({
        imports: [
            auth_module_1.AuthModule,
            gatekeeper_module_1.GatekeeperModule,
            probabilistic_vacancy_module_1.ProbabilisticVacancyModule,
            gateway_module_1.RealTimeGatewayModule,
        ],
        controllers: [matchmaker_controller_1.MatchmakerController],
        providers: [
            spatial_matchmaker_service_1.SpatialMatchmakerService,
            match_scoring_engine_1.MatchScoringEngine,
            candidate_discovery_service_1.CandidateDiscoveryService,
            {
                provide: match_repository_port_1.MATCH_REPOSITORY_PORT,
                useFactory: () => {
                    return process.env.DATABASE_URL
                        ? new postgres_match_repository_1.PostgresMatchRepository()
                        : new in_memory_match_repository_1.InMemoryMatchRepository();
                },
            },
            {
                provide: distributed_lock_port_1.DISTRIBUTED_LOCK_PORT,
                useFactory: () => {
                    return process.env.REDIS_URL
                        ? new redis_lock_adapter_1.RedisDistributedLockAdapter()
                        : new in_memory_lock_adapter_1.InMemoryLockAdapter();
                },
            },
        ],
        exports: [
            spatial_matchmaker_service_1.SpatialMatchmakerService,
            match_scoring_engine_1.MatchScoringEngine,
            candidate_discovery_service_1.CandidateDiscoveryService,
            match_repository_port_1.MATCH_REPOSITORY_PORT,
            distributed_lock_port_1.DISTRIBUTED_LOCK_PORT,
        ],
    })
], SpatialMatchmakerModule);
//# sourceMappingURL=spatial-matchmaker.module.js.map