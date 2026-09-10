import { Injectable } from '@nestjs/common';

export interface CandidateMetrics {
  searcherId: string;
  searcherEtaSeconds: number; // ETA_searcher
  leaverCountdownSeconds: number; // t_leave
  distanceMeters: number; // d <= 1000m
  reliabilityRating: number; // Rating in [0.00, 5.00]
}

export interface MatchScoreResult {
  searcherId: string;
  score: number;
  etaSyncComponent: number;
  distanceComponent: number;
  ratingComponent: number;
}

@Injectable()
export class MatchScoringEngine {
  public static readonly W_ETA = 0.50;
  public static readonly W_DIST = 0.35;
  public static readonly W_RATING = 0.15;
  public static readonly MAX_ETA_DIFF = 300; // 5 mins
  public static readonly MAX_RADIUS = 1000; // 1.0 km

  public scoreCandidate(metrics: CandidateMetrics): MatchScoreResult {
    // 1. ETA sync component: 1 - |ETA - t_leave| / 300
    const etaDiff = Math.abs(metrics.searcherEtaSeconds - metrics.leaverCountdownSeconds);
    const rawEtaFactor = 1 - etaDiff / MatchScoringEngine.MAX_ETA_DIFF;
    const etaSyncComponent = Math.max(0, Math.min(1, rawEtaFactor));

    // 2. Proximity distance component: 1 - d / 1000
    const rawDistFactor = 1 - metrics.distanceMeters / MatchScoringEngine.MAX_RADIUS;
    const distanceComponent = Math.max(0, Math.min(1, rawDistFactor));

    // 3. Reliability rating component: Rating / 5.0
    const ratingClamped = Math.max(0, Math.min(5, metrics.reliabilityRating));
    const ratingComponent = ratingClamped / 5.0;

    // Total weighted score
    const totalScore =
      MatchScoringEngine.W_ETA * etaSyncComponent +
      MatchScoringEngine.W_DIST * distanceComponent +
      MatchScoringEngine.W_RATING * ratingComponent;

    const roundedScore = Math.round(Math.max(0, Math.min(1, totalScore)) * 1000) / 1000;

    return {
      searcherId: metrics.searcherId,
      score: roundedScore,
      etaSyncComponent: Math.round(etaSyncComponent * 1000) / 1000,
      distanceComponent: Math.round(distanceComponent * 1000) / 1000,
      ratingComponent: Math.round(ratingComponent * 1000) / 1000,
    };
  }

  public rankCandidates(candidates: CandidateMetrics[]): MatchScoreResult[] {
    return candidates
      .map((c) => this.scoreCandidate(c))
      .sort((a, b) => b.score - a.score);
  }
}
