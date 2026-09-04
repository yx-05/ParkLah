export interface DecayParameters {
    initialP?: number;
    decayConstant?: number;
    trafficMultiplier?: number;
    maxLifespanMinutes?: number;
    minConfidenceCutoff?: number;
}
export declare class DecayEngine {
    static readonly DEFAULT_P0 = 0.95;
    static readonly DEFAULT_LAMBDA = 0.15;
    static readonly DEFAULT_MAX_MINUTES = 15;
    static readonly DEFAULT_MIN_CUTOFF = 0.15;
    calculateProbability(elapsedMinutes: number, params?: DecayParameters): number;
    calculateCurrentProbability(vacatedAt: Date, trafficMultiplier?: number, currentTime?: Date): number;
}
