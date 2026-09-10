import { OnModuleInit } from '@nestjs/common';
import { IMlMatchScoringPort, MlCandidateFeatures, ScoredMatchCandidate } from '../../domain/ports/ml-match-scoring.port';
export declare class OnnxMlMatchScoringAdapter implements IMlMatchScoringPort, OnModuleInit {
    private readonly logger;
    private session;
    private readonly modelPath;
    static readonly FEATURE_COUNT = 26;
    static readonly MIN_DISPATCH_PROBABILITY = 0.4;
    constructor(customModelPath?: string);
    onModuleInit(): Promise<void>;
    initSession(): Promise<boolean>;
    scoreCandidates(candidates: MlCandidateFeatures[]): Promise<ScoredMatchCandidate[]>;
    private fallbackHeuristicScoring;
}
