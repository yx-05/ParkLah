"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationAndDisputeModule = void 0;
const common_1 = require("@nestjs/common");
const verification_service_1 = require("./application/services/verification.service");
const geofence_engine_1 = require("./domain/services/geofence.engine");
const telemetry_integrity_service_1 = require("./domain/services/telemetry-integrity.service");
const verification_controller_1 = require("./infrastructure/controllers/verification.controller");
const dispute_repository_port_1 = require("./domain/ports/dispute-repository.port");
const postgres_dispute_repository_1 = require("./infrastructure/adapters/postgres-dispute.repository");
const in_memory_dispute_repository_1 = require("./infrastructure/adapters/in-memory-dispute.repository");
const spatial_matchmaker_module_1 = require("../matchmaker/spatial-matchmaker.module");
const wallet_module_1 = require("../wallet/wallet.module");
const probabilistic_vacancy_module_1 = require("../probabilistic/probabilistic-vacancy.module");
const gateway_module_1 = require("../gateway/gateway.module");
const auth_module_1 = require("../auth/auth.module");
let VerificationAndDisputeModule = class VerificationAndDisputeModule {
};
exports.VerificationAndDisputeModule = VerificationAndDisputeModule;
exports.VerificationAndDisputeModule = VerificationAndDisputeModule = __decorate([
    (0, common_1.Module)({
        imports: [
            auth_module_1.AuthModule,
            spatial_matchmaker_module_1.SpatialMatchmakerModule,
            wallet_module_1.WalletModule,
            probabilistic_vacancy_module_1.ProbabilisticVacancyModule,
            gateway_module_1.RealTimeGatewayModule,
        ],
        controllers: [verification_controller_1.VerificationController],
        providers: [
            verification_service_1.VerificationService,
            geofence_engine_1.GeofenceEngine,
            telemetry_integrity_service_1.TelemetryIntegrityService,
            {
                provide: dispute_repository_port_1.DISPUTE_REPOSITORY_PORT,
                useFactory: () => {
                    return process.env.DATABASE_URL
                        ? new postgres_dispute_repository_1.PostgresDisputeRepository()
                        : new in_memory_dispute_repository_1.InMemoryDisputeRepository();
                },
            },
        ],
        exports: [
            verification_service_1.VerificationService,
            geofence_engine_1.GeofenceEngine,
            telemetry_integrity_service_1.TelemetryIntegrityService,
            dispute_repository_port_1.DISPUTE_REPOSITORY_PORT,
        ],
    })
], VerificationAndDisputeModule);
//# sourceMappingURL=verification.module.js.map