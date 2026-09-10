import { Pool } from 'pg';
import { IMlFeatureRepositoryPort, MlMatchFeatureRecord } from '../../domain/ports/ml-feature-repository.port';
export declare class PostgresMlFeatureRepository implements IMlFeatureRepositoryPort {
    private pool;
    constructor(pool?: Pool);
    saveFeatureSnapshot(record: MlMatchFeatureRecord): Promise<MlMatchFeatureRecord>;
    updateOutcome(matchId: string, outcome: 0 | 1, reason: string, settledAt?: Date): Promise<boolean>;
    findRecentFeatures(limit?: number): Promise<MlMatchFeatureRecord[]>;
}
