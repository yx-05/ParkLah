"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var MatchScoringEngine_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchScoringEngine = void 0;
const common_1 = require("@nestjs/common");
let MatchScoringEngine = MatchScoringEngine_1 = class MatchScoringEngine {
    scoreCandidate(metrics) {
        const etaDiff = Math.abs(metrics.searcherEtaSeconds - metrics.leaverCountdownSeconds);
        const rawEtaFactor = 1 - etaDiff / MatchScoringEngine_1.MAX_ETA_DIFF;
        const etaSyncComponent = Math.max(0, Math.min(1, rawEtaFactor));
        const rawDistFactor = 1 - metrics.distanceMeters / MatchScoringEngine_1.MAX_RADIUS;
        const distanceComponent = Math.max(0, Math.min(1, rawDistFactor));
        const ratingClamped = Math.max(0, Math.min(5, metrics.reliabilityRating));
        const ratingComponent = ratingClamped / 5.0;
        const totalScore = MatchScoringEngine_1.W_ETA * etaSyncComponent +
            MatchScoringEngine_1.W_DIST * distanceComponent +
            MatchScoringEngine_1.W_RATING * ratingComponent;
        const roundedScore = Math.round(Math.max(0, Math.min(1, totalScore)) * 1000) / 1000;
        return {
            searcherId: metrics.searcherId,
            score: roundedScore,
            etaSyncComponent: Math.round(etaSyncComponent * 1000) / 1000,
            distanceComponent: Math.round(distanceComponent * 1000) / 1000,
            ratingComponent: Math.round(ratingComponent * 1000) / 1000,
        };
    }
    rankCandidates(candidates) {
        return candidates
            .map((c) => this.scoreCandidate(c))
            .sort((a, b) => b.score - a.score);
    }
};
exports.MatchScoringEngine = MatchScoringEngine;
MatchScoringEngine.W_ETA = 0.50;
MatchScoringEngine.W_DIST = 0.35;
MatchScoringEngine.W_RATING = 0.15;
MatchScoringEngine.MAX_ETA_DIFF = 300;
MatchScoringEngine.MAX_RADIUS = 1000;
exports.MatchScoringEngine = MatchScoringEngine = MatchScoringEngine_1 = __decorate([
    (0, common_1.Injectable)()
], MatchScoringEngine);
//# sourceMappingURL=match-scoring.engine.js.map