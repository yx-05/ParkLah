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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var MlFeatureLoggerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MlFeatureLoggerService = void 0;
const common_1 = require("@nestjs/common");
const ml_feature_repository_port_1 = require("../../domain/ports/ml-feature-repository.port");
let MlFeatureLoggerService = MlFeatureLoggerService_1 = class MlFeatureLoggerService {
    constructor(featureRepo) {
        this.featureRepo = featureRepo;
        this.logger = new common_1.Logger(MlFeatureLoggerService_1.name);
    }
    async logInferenceSnapshot(record) {
        try {
            await this.featureRepo.saveFeatureSnapshot(record);
        }
        catch (err) {
            this.logger.error(`Failed to log ML feature snapshot: ${err.message}`, err.stack);
        }
    }
    async recordOutcome(matchId, outcome, reason) {
        try {
            await this.featureRepo.updateOutcome(matchId, outcome, reason, new Date());
        }
        catch (err) {
            this.logger.error(`Failed to record ML ground truth outcome for match ${matchId}: ${err.message}`, err.stack);
        }
    }
};
exports.MlFeatureLoggerService = MlFeatureLoggerService;
exports.MlFeatureLoggerService = MlFeatureLoggerService = MlFeatureLoggerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(ml_feature_repository_port_1.ML_FEATURE_REPOSITORY_PORT)),
    __metadata("design:paramtypes", [Object])
], MlFeatureLoggerService);
//# sourceMappingURL=ml-feature-logger.service.js.map