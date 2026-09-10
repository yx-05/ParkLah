export const ML_FEATURE_REPOSITORY_PORT = Symbol('IMlFeatureRepositoryPort');

export interface MlMatchFeatureRecord {
  id?: string;
  matchId?: string;
  searcherId: string;
  leaverId?: string;
  spotLatitude: number;
  spotLongitude: number;
  predictedProbability: number;
  dispatchRank: number;
  modelVersion: string;
  featurePayload: Record<string, any>;
  groundTruthOutcome?: number; // 0 | 1
  outcomeReason?: string;
  createdAt?: Date;
  settledAt?: Date;
}

export interface IMlFeatureRepositoryPort {
  saveFeatureSnapshot(record: MlMatchFeatureRecord): Promise<MlMatchFeatureRecord>;
  updateOutcome(
    matchId: string,
    outcome: 0 | 1,
    reason: string,
    settledAt?: Date,
  ): Promise<boolean>;
  findRecentFeatures(limit?: number): Promise<MlMatchFeatureRecord[]>;
}
