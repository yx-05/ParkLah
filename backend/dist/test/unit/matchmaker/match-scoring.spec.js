"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const match_scoring_engine_1 = require("../../../src/modules/matchmaker/domain/services/match-scoring.engine");
describe('MatchScoringEngine (Module 5 Unit Tests)', () => {
    let scoringEngine;
    beforeEach(() => {
        scoringEngine = new match_scoring_engine_1.MatchScoringEngine();
    });
    it('should return score = 1.0 for perfect synchronization, 0 distance, and 5.0 rating', () => {
        const result = scoringEngine.scoreCandidate({
            searcherId: 'searcher-perfect',
            searcherEtaSeconds: 240,
            leaverCountdownSeconds: 240,
            distanceMeters: 0,
            reliabilityRating: 5.0,
        });
        expect(result.score).toBe(1.0);
        expect(result.etaSyncComponent).toBe(1.0);
        expect(result.distanceComponent).toBe(1.0);
        expect(result.ratingComponent).toBe(1.0);
    });
    it('should compute weighted score with w1=0.50, w2=0.35, w3=0.15', () => {
        const result = scoringEngine.scoreCandidate({
            searcherId: 'searcher-mid',
            searcherEtaSeconds: 390,
            leaverCountdownSeconds: 240,
            distanceMeters: 500,
            reliabilityRating: 4.0,
        });
        expect(result.score).toBeCloseTo(0.545, 3);
        expect(result.etaSyncComponent).toBe(0.50);
        expect(result.distanceComponent).toBe(0.50);
        expect(result.ratingComponent).toBe(0.80);
    });
    it('should rank candidates in descending order of multi-factor score', () => {
        const candidates = [
            {
                searcherId: 'candidate-low',
                searcherEtaSeconds: 600,
                leaverCountdownSeconds: 200,
                distanceMeters: 900,
                reliabilityRating: 3.0,
            },
            {
                searcherId: 'candidate-high',
                searcherEtaSeconds: 220,
                leaverCountdownSeconds: 240,
                distanceMeters: 150,
                reliabilityRating: 4.8,
            },
            {
                searcherId: 'candidate-mid',
                searcherEtaSeconds: 300,
                leaverCountdownSeconds: 240,
                distanceMeters: 400,
                reliabilityRating: 4.5,
            },
        ];
        const ranked = scoringEngine.rankCandidates(candidates);
        expect(ranked.length).toBe(3);
        expect(ranked[0].searcherId).toBe('candidate-high');
        expect(ranked[1].searcherId).toBe('candidate-mid');
        expect(ranked[2].searcherId).toBe('candidate-low');
        expect(ranked[0].score).toBeGreaterThan(ranked[1].score);
        expect(ranked[1].score).toBeGreaterThan(ranked[2].score);
    });
});
//# sourceMappingURL=match-scoring.spec.js.map