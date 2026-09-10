import { IProbabilisticSpotRepositoryPort, CandidateSpotResult } from '../../domain/ports/probabilistic-spot-repository.port';
import { ProbabilisticSpotEntity } from '../../domain/entities/probabilistic-spot.entity';
import { SpotStatus } from '../../domain/enums/spot-status.enum';
export declare class InMemoryProbabilisticSpotRepository implements IProbabilisticSpotRepositoryPort {
    private spots;
    create(spot: ProbabilisticSpotEntity): Promise<ProbabilisticSpotEntity>;
    findById(id: string): Promise<ProbabilisticSpotEntity | null>;
    findAllAvailable(): Promise<ProbabilisticSpotEntity[]>;
    findActiveWithinRadius(latitude: number, longitude: number, radiusMeters?: number, limit?: number): Promise<CandidateSpotResult[]>;
    update(spot: ProbabilisticSpotEntity): Promise<ProbabilisticSpotEntity>;
    updateBatchProbabilities(updates: Array<{
        id: string;
        currentP: number;
        status?: SpotStatus;
    }>): Promise<void>;
    expireSpotsBatch(cutoffTime: Date): Promise<number>;
    private haversineDistanceMeters;
    private deg2rad;
    clear(): void;
}
