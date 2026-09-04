import { MatchScoringEngine } from '../../../src/modules/matchmaker/domain/services/match-scoring.engine';

describe('MatchScoringEngine (Module 5 Unit Tests)', () => {
  let scoringEngine: MatchScoringEngine;

  beforeEach(() => {
    scoringEngine = new MatchScoringEngine();
  });

  it('should return score = 1.0 for perfect synchronization, 0 distance, and 5.0 rating', () => {
    const result = scoringEngine.scoreCandidate({
      searcherId: 'searcher-perfect',
      searcherEtaSeconds: 240,
      leaverCountdownSeconds: 240, // ETA diff = 0
      distanceMeters: 0, // distance = 0
      reliabilityRating: 5.0, // rating = 5.0
    });

    expect(result.score).toBe(1.0);
    expect(result.etaSyncComponent).toBe(1.0);
    expect(result.distanceComponent).toBe(1.0);
    expect(result.ratingComponent).toBe(1.0);
  });

  it('should compute weighted score with w1=0.50, w2=0.35, w3=0.15', () => {
    // ETA diff = 150s -> ETA factor = 1 - 150/300 = 0.50 -> 0.50 * 0.50 = 0.25
    // Distance = 500m -> Dist factor = 1 - 500/1000 = 0.50 -> 0.35 * 0.50 = 0.175
    // Rating = 4.0 -> Rating factor = 4.0/5.0 = 0.80 -> 0.15 * 0.80 = 0.12
    // Expected score = 0.25 + 0.175 + 0.12 = 0.545
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
