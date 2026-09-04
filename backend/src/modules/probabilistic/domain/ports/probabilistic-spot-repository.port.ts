import { ProbabilisticSpotEntity } from '../entities/probabilistic-spot.entity';
import { SpotStatus } from '../enums/spot-status.enum';

export const PROBABILISTIC_SPOT_REPOSITORY_PORT = Symbol('IProbabilisticSpotRepositoryPort');

export interface CandidateSpotResult {
  spot: ProbabilisticSpotEntity;
  distanceMeters: number;
}

export interface IProbabilisticSpotRepositoryPort {
  create(spot: ProbabilisticSpotEntity): Promise<ProbabilisticSpotEntity>;
  findById(id: string): Promise<ProbabilisticSpotEntity | null>;
  findActiveWithinRadius(
    latitude: number,
    longitude: number,
    radiusMeters?: number,
    limit?: number,
  ): Promise<CandidateSpotResult[]>;
  findAllAvailable(): Promise<ProbabilisticSpotEntity[]>;
  update(spot: ProbabilisticSpotEntity): Promise<ProbabilisticSpotEntity>;
  updateBatchProbabilities(updates: Array<{ id: string; currentP: number; status?: SpotStatus }>): Promise<void>;
  expireSpotsBatch(cutoffTime: Date): Promise<number>;
}
