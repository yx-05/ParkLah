export interface GatekeeperEvaluation {
    isUnlocked: boolean;
    distanceMeters: number;
    durationSeconds: number;
    reason?: string;
}
export declare class GatekeeperEvaluatorService {
    static readonly MAX_DISTANCE_METERS = 3000;
    static readonly MAX_DURATION_SECONDS = 600;
    evaluate(distanceMeters: number, durationSeconds: number): GatekeeperEvaluation;
}
