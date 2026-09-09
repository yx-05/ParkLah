export declare const ML_MATCH_SCORING_PORT: unique symbol;
export interface MlCandidateFeatures {
    searcherId: string;
    roadDistanceMeters: number;
    euclidDistanceMeters: number;
    detourRatio: number;
    spotToDestDistanceMeters: number;
    roadEtaSeconds: number;
    leaverCountdownSeconds: number;
    absEtaCountdownDiff: number;
    signedTimeSlack: number;
    hourOfDay: number;
    dayOfWeek: number;
    isRushHour: number;
    isWeekend: number;
    currentSpeedKmh: number;
    headingBearingDiffDeg: number;
    headingDestDiffDeg: number;
    gpsAccuracyMeters: number;
    pingStalenessSeconds: number;
    driverReliabilityRating: number;
    historicalAcceptanceRate: number;
    historicalCompletionRate: number;
    historicalCancellationRate: number;
    lifetimeMatchesCount: number;
    spotTypeEnum: number;
    vehicleSizeCompatibility: number;
    hasLandmarkNote: number;
    landmarkNoteLength: number;
}
export interface ScoredMatchCandidate {
    searcherId: string;
    successProbability: number;
    features: MlCandidateFeatures;
}
export interface IMlMatchScoringPort {
    scoreCandidates(candidates: MlCandidateFeatures[]): Promise<ScoredMatchCandidate[]>;
}
