import * as path from 'path';
import { OnnxMlMatchScoringAdapter } from '../../../src/modules/matchmaker/infrastructure/adapters/onnx-ml-match-scoring.adapter';
import { MlCandidateFeatures } from '../../../src/modules/matchmaker/domain/ports/ml-match-scoring.port';

describe('OnnxMlMatchScoringAdapter', () => {
  let adapter: OnnxMlMatchScoringAdapter;
  const modelPath = path.resolve(__dirname, '../../../src/modules/matchmaker/infrastructure/models/parklah_matchmaker_v1.onnx');

  beforeAll(async () => {
    adapter = new OnnxMlMatchScoringAdapter(modelPath);
    await adapter.onModuleInit();
  });

  const baseFeatures: MlCandidateFeatures = {
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
    // Candidate A: High punctuality, aligned heading, high rating
    const candidateA: MlCandidateFeatures = {
      ...baseFeatures,
      searcherId: 'driver-A-punctual',
      roadDistanceMeters: 420,
      roadEtaSeconds: 170, // almost exact match with 180s countdown
      absEtaCountdownDiff: 10,
      driverReliabilityRating: 4.95,
      historicalCompletionRate: 0.98,
    };

    // Candidate B: Moderate detour, slightly further
    const candidateB: MlCandidateFeatures = {
      ...baseFeatures,
      searcherId: 'driver-B-moderate',
      roadDistanceMeters: 850,
      roadEtaSeconds: 260,
      absEtaCountdownDiff: 80,
      detourRatio: 1.45,
      driverReliabilityRating: 4.50,
      historicalCompletionRate: 0.85,
    };

    // Candidate C: Large detour, heading divergence, lower rating
    const candidateC: MlCandidateFeatures = {
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
    // Should be sorted descending by success probability
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
    const fallbackAdapter = new OnnxMlMatchScoringAdapter('/invalid/path/nonexistent.onnx');
    await fallbackAdapter.onModuleInit();

    const results = await fallbackAdapter.scoreCandidates([baseFeatures]);
    expect(results).toHaveLength(1);
    expect(results[0].searcherId).toBe('searcher-1');
    expect(results[0].successProbability).toBeGreaterThan(0);
  });
});
