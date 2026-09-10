import { IProbabilisticSpotRepositoryPort } from '../../domain/ports/probabilistic-spot-repository.port';
import { DecayEngine } from '../../domain/services/decay.engine';
import { ProbabilisticSpotEntity } from '../../domain/entities/probabilistic-spot.entity';
import { CreateProbabilisticSpotDto, QueryCandidateSpotsDto } from '../dto';
export interface CandidateSpotResponse {
    spotId: string;
    latitude: number;
    longitude: number;
    distanceMeters: number;
    probabilityScore: number;
    probabilityLabel: 'High Chance' | 'Moderate' | 'Low' | 'Expired';
    landmarkNote: string | null;
    vacatedAt: Date;
    expiresAt: Date;
}
export declare class ProbabilisticVacancyService {
    private readonly spotRepository;
    private readonly decayEngine;
    constructor(spotRepository: IProbabilisticSpotRepositoryPort, decayEngine: DecayEngine);
    persistVacatedSpot(dto: CreateProbabilisticSpotDto): Promise<ProbabilisticSpotEntity>;
    queryTopCandidateSpots(dto: QueryCandidateSpotsDto): Promise<{
        candidates: CandidateSpotResponse[];
        totalFound: number;
    }>;
    batchDecayTick(): Promise<{
        updatedCount: number;
        expiredCount: number;
    }>;
    invalidateSpot(spotId: string, reason: 'OCCUPIED' | 'RESERVED'): Promise<ProbabilisticSpotEntity | null>;
    expireSpotsBatch(): Promise<number>;
}
