import { Injectable, Inject } from '@nestjs/common';
import {
  IProbabilisticSpotRepositoryPort,
  PROBABILISTIC_SPOT_REPOSITORY_PORT,
} from '../../domain/ports/probabilistic-spot-repository.port';
import { DecayEngine } from '../../domain/services/decay.engine';
import { ProbabilisticSpotEntity } from '../../domain/entities/probabilistic-spot.entity';
import { SpotStatus } from '../../domain/enums/spot-status.enum';
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

@Injectable()
export class ProbabilisticVacancyService {
  constructor(
    @Inject(PROBABILISTIC_SPOT_REPOSITORY_PORT)
    private readonly spotRepository: IProbabilisticSpotRepositoryPort,
    private readonly decayEngine: DecayEngine,
  ) {}

  async persistVacatedSpot(dto: CreateProbabilisticSpotDto): Promise<ProbabilisticSpotEntity> {
    const spot = new ProbabilisticSpotEntity({
      leaverId: dto.leaverId || null,
      latitude: dto.latitude,
      longitude: dto.longitude,
      initialP: 0.950,
      currentP: 0.950,
      areaTrafficMultiplier: dto.areaTrafficMultiplier ?? 1.0,
      landmarkNote: dto.landmarkNote || null,
      status: SpotStatus.AVAILABLE,
    });

    return this.spotRepository.create(spot);
  }

  async queryTopCandidateSpots(
    dto: QueryCandidateSpotsDto,
  ): Promise<{ candidates: CandidateSpotResponse[]; totalFound: number }> {
    const radius = dto.radiusMeters ?? 500;
    const results = await this.spotRepository.findActiveWithinRadius(
      dto.latitude,
      dto.longitude,
      radius,
      3,
    );

    const candidates: CandidateSpotResponse[] = results.map(({ spot, distanceMeters }) => {
      // Recalculate live decay probability
      const liveP = this.decayEngine.calculateCurrentProbability(
        spot.vacatedAt,
        spot.areaTrafficMultiplier,
      );
      spot.applyDecay(liveP);

      return {
        spotId: spot.id,
        latitude: spot.latitude,
        longitude: spot.longitude,
        distanceMeters,
        probabilityScore: spot.currentP,
        probabilityLabel: spot.getProbabilityLabel(),
        landmarkNote: spot.landmarkNote,
        vacatedAt: spot.vacatedAt,
        expiresAt: spot.expiresAt,
      };
    });

    return {
      candidates: candidates.filter((c) => c.probabilityScore >= 0.150),
      totalFound: candidates.length,
    };
  }

  async batchDecayTick(): Promise<{ updatedCount: number; expiredCount: number }> {
    const availableSpots = await this.spotRepository.findAllAvailable();
    const updates: Array<{ id: string; currentP: number; status?: SpotStatus }> = [];
    let expiredCount = 0;

    const now = new Date();
    for (const spot of availableSpots) {
      const liveP = this.decayEngine.calculateCurrentProbability(
        spot.vacatedAt,
        spot.areaTrafficMultiplier,
        now,
      );

      if (liveP <= 0 || liveP < 0.150 || spot.isExpired()) {
        updates.push({ id: spot.id, currentP: 0.0, status: SpotStatus.EXPIRED });
        expiredCount++;
      } else {
        updates.push({ id: spot.id, currentP: liveP });
      }
    }

    if (updates.length > 0) {
      await this.spotRepository.updateBatchProbabilities(updates);
    }

    return {
      updatedCount: updates.length - expiredCount,
      expiredCount,
    };
  }

  async invalidateSpot(spotId: string, reason: 'OCCUPIED' | 'RESERVED'): Promise<ProbabilisticSpotEntity | null> {
    const spot = await this.spotRepository.findById(spotId);
    if (!spot) return null;

    if (reason === 'OCCUPIED') {
      spot.markOccupied();
    } else {
      spot.markReserved();
    }

    return this.spotRepository.update(spot);
  }

  async expireSpotsBatch(): Promise<number> {
    return this.spotRepository.expireSpotsBatch(new Date());
  }
}
