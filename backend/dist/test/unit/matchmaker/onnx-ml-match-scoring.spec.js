"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const onnx_ml_match_scoring_adapter_1 = require("../../../src/modules/matchmaker/infrastructure/adapters/onnx-ml-match-scoring.adapter");
describe('OnnxMlMatchScoringAdapter', () => {
    let adapter;
    const modelPath = path.resolve(__dirname, '../../../src/modules/matchmaker/infrastructure/models/parklah_matchmaker_v1.onnx');
    beforeAll(async () => {
        adapter = new onnx_ml_match_scoring_adapter_1.OnnxMlMatchScoringAdapter(modelPath);
        await adapter.onModuleInit();
    });
    const baseFeatures = {
        searcherId: 'searcher-1',
        roadDistanceMeters: 450,
        euclidDistanceMeters: 380,
        detourRatio: 1.18,
        spotToDestDistanceMeters: 120,
        roadEtaSeconds: 160,
        leaverCountdownSeconds: 180,
        absEtaCountdownDiff: 20,
        signedTimeSlack: -20,
        hourOfDay: 14,
        dayOfWeek: 2,
        isRushHour: 0,
        isWeekend: 0,
        currentSpeedKmh: 26,
        headingBearingDiffDeg: 12,
        headingDestDiffDeg: 15,
        gpsAccuracyMeters: 6,
        pingStalenessSeconds: 2,
        driverReliabilityRating: 4.85,
        historicalAcceptanceRate: 0.95,
        historicalCompletionRate: 0.96,
        historicalCancellationRate: 0.02,
        lifetimeMatchesCount: 38,
        spotTypeEnum: 0,
        vehicleSizeCompatibility: 1,
        hasLandmarkNote: 1,
        landmarkNoteLength: 25,
    };
    it('should infer success probabilities and rank candidates descending', async () => {
        const candidateA = {
            ...baseFeatures,
            searcherId: 'driver-A-punctual',
            roadDistanceMeters: 420,
            roadEtaSeconds: 170,
            absEtaCountdownDiff: 10,
            driverReliabilityRating: 4.95,
            historicalCompletionRate: 0.98,
        };
        const candidateB = {
            ...baseFeatures,
            searcherId: 'driver-B-moderate',
            roadDistanceMeters: 850,
            roadEtaSeconds: 260,
            absEtaCountdownDiff: 80,
            detourRatio: 1.45,
            driverReliabilityRating: 4.50,
            historicalCompletionRate: 0.85,
        };
        const candidateC = {
            ...baseFeatures,
            searcherId: 'driver-C-divergent',
            roadDistanceMeters: 1400,
            roadEtaSeconds: 380,
            absEtaCountdownDiff: 200,
            detourRatio: 2.10,
            headingBearingDiffDeg: 75,
            driverReliabilityRating: 3.80,
            historicalCompletionRate: 0.65,
        };
        const results = await adapter.scoreCandidates([candidateC, candidateA, candidateB]);
        expect(results).toHaveLength(3);
        expect(results[0].searcherId).toBe('driver-A-punctual');
        expect(results[0].successProbability).toBeGreaterThan(0.70);
        expect(results[1].searcherId).toBe('driver-B-moderate');
        expect(results[2].searcherId).toBe('driver-C-divergent');
        expect(results[2].successProbability).toBeLessThan(results[1].successProbability);
    });
    it('should return empty array for empty candidates list', async () => {
        const results = await adapter.scoreCandidates([]);
        expect(results).toEqual([]);
    });
    it('should fall back gracefully to heuristic if model file does not exist', async () => {
        const fallbackAdapter = new onnx_ml_match_scoring_adapter_1.OnnxMlMatchScoringAdapter('/invalid/path/nonexistent.onnx');
        await fallbackAdapter.onModuleInit();
        const results = await fallbackAdapter.scoreCandidates([baseFeatures]);
        expect(results).toHaveLength(1);
        expect(results[0].searcherId).toBe('searcher-1');
        expect(results[0].successProbability).toBeGreaterThan(0);
    });
});
//# sourceMappingURL=onnx-ml-match-scoring.spec.js.map