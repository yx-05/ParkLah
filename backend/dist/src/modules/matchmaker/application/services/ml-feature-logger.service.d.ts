import { IMlFeatureRepositoryPort, MlMatchFeatureRecord } from '../../domain/ports/ml-feature-repository.port';
export declare class MlFeatureLoggerService {
    private readonly featureRepo;
    private readonly logger;
    constructor(featureRepo: IMlFeatureRepositoryPort);
    logInferenceSnapshot(record: MlMatchFeatureRecord): Promise<void>;
    recordOutcome(matchId: string, outcome: 0 | 1, reason: string): Promise<void>;
}
