export interface CandidateMetrics {
    searcherId: string;
    searcherEtaSeconds: number;
    leaverCountdownSeconds: number;
    distanceMeters: number;
    reliabilityRating: number;
}
export interface MatchScoreResult {
    searcherId: string;
    score: number;
    etaSyncComponent: number;
    distanceComponent: number;
    ratingComponent: number;
}
export declare class MatchScoringEngine {
    static readonly W_ETA = 0.5;
    static readonly W_DIST = 0.35;
    static readonly W_RATING = 0.15;
    static readonly MAX_ETA_DIFF = 300;
    static readonly MAX_RADIUS = 1000;
    scoreCandidate(metrics: CandidateMetrics): MatchScoreResult;
    rankCandidates(candidates: CandidateMetrics[]): MatchScoreResult[];
}
