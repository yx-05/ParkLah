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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CandidateDiscoveryService = void 0;
const common_1 = require("@nestjs/common");
const searcher_spatial_repository_port_1 = require("../../../gatekeeper/domain/ports/searcher-spatial-repository.port");
const user_repository_port_1 = require("../../../auth/domain/ports/user-repository.port");
const match_scoring_engine_1 = require("../../domain/services/match-scoring.engine");
let CandidateDiscoveryService = class CandidateDiscoveryService {
    constructor(searcherRepo, userRepo, scoringEngine) {
        this.searcherRepo = searcherRepo;
        this.userRepo = userRepo;
        this.scoringEngine = scoringEngine;
    }
    async discoverAndRankCandidates(spotCoords, leaverCountdownSeconds, radiusMeters = 1000) {
        const nearby = await this.searcherRepo.findNearbyActiveSearchers(spotCoords, radiusMeters);
        if (nearby.length === 0) {
            return [];
        }
        const candidateMetrics = [];
        for (const { searcher, distanceMeters } of nearby) {
            const user = await this.userRepo.findById(searcher.searcherId);
            const reliabilityRating = user ? user.reliabilityRating : 5.0;
            const searcherEtaSeconds = Math.round(distanceMeters / 8.33);
            candidateMetrics.push({
                searcherId: searcher.searcherId,
                searcherEtaSeconds,
                leaverCountdownSeconds,
                distanceMeters,
                reliabilityRating,
            });
        }
        const rankedScores = this.scoringEngine.rankCandidates(candidateMetrics);
        return rankedScores.map((scoreResult) => {
            const metric = candidateMetrics.find((m) => m.searcherId === scoreResult.searcherId);
            return {
                searcherId: scoreResult.searcherId,
                distanceMeters: metric.distanceMeters,
                score: scoreResult.score,
                scoreBreakdown: scoreResult,
            };
        });
    }
};
exports.CandidateDiscoveryService = CandidateDiscoveryService;
exports.CandidateDiscoveryService = CandidateDiscoveryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(searcher_spatial_repository_port_1.SEARCHER_SPATIAL_REPOSITORY_PORT)),
    __param(1, (0, common_1.Inject)(user_repository_port_1.USER_REPOSITORY_PORT)),
    __metadata("design:paramtypes", [Object, Object, match_scoring_engine_1.MatchScoringEngine])
], CandidateDiscoveryService);
//# sourceMappingURL=candidate-discovery.service.js.map