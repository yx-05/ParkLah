import { Injectable } from '@nestjs/common';
import {
  IProbabilisticSpotRepositoryPort,
  CandidateSpotResult,
} from '../../domain/ports/probabilistic-spot-repository.port';
import { ProbabilisticSpotEntity } from '../../domain/entities/probabilistic-spot.entity';
import { SpotStatus } from '../../domain/enums/spot-status.enum';

@Injectable()
export class InMemoryProbabilisticSpotRepository implements IProbabilisticSpotRepositoryPort {
  private spots = new Map<string, ProbabilisticSpotEntity>();

  async create(spot: ProbabilisticSpotEntity): Promise<ProbabilisticSpotEntity> {
    this.spots.set(spot.id, spot);
    return spot;
  }

  async findById(id: string): Promise<ProbabilisticSpotEntity | null> {
    return this.spots.get(id) || null;
  }

  async findAllAvailable(): Promise<ProbabilisticSpotEntity[]> {
    return Array.from(this.spots.values()).filter((s) => s.status === SpotStatus.AVAILABLE);
  }

  async findActiveWithinRadius(
    latitude: number,
    longitude: number,
    radiusMeters = 500,
    limit = 3,
  ): Promise<CandidateSpotResult[]> {
    const results: CandidateSpotResult[] = [];

    for (const spot of this.spots.values()) {
      if (spot.status !== SpotStatus.AVAILABLE || spot.currentP < 0.150) {
        continue;
      }

      const distance = this.haversineDistanceMeters(latitude, longitude, spot.latitude, spot.longitude);
      if (distance <= radiusMeters) {
        results.push({ spot, distanceMeters: Math.round(distance) });
      }
    }

    // Sort by current_p DESC, distance ASC
    results.sort((a, b) => {
      if (b.spot.currentP !== a.spot.currentP) {
        return b.spot.currentP - a.spot.currentP;
      }
      return a.distanceMeters - b.distanceMeters;
    });

    return results.slice(0, limit);
  }

  async update(spot: ProbabilisticSpotEntity): Promise<ProbabilisticSpotEntity> {
    this.spots.set(spot.id, spot);
    return spot;
  }

  async updateBatchProbabilities(
    updates: Array<{ id: string; currentP: number; status?: SpotStatus }>,
  ): Promise<void> {
    for (const u of updates) {
      const spot = this.spots.get(u.id);
      if (spot) {
        spot.applyDecay(u.currentP);
        if (u.status) {
          spot.status = u.status;
        }
      }
    }
  }

  async expireSpotsBatch(cutoffTime: Date): Promise<number> {
    let count = 0;
    for (const spot of this.spots.values()) {
      if (
        spot.status === SpotStatus.AVAILABLE &&
        (spot.expiresAt.getTime() < cutoffTime.getTime() || spot.currentP < 0.150)
      ) {
        spot.applyDecay(0.0);
        spot.status = SpotStatus.EXPIRED;
        count++;
      }
    }
    return count;
  }

  private haversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Radius of the earth in m
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  public clear(): void {
    this.spots.clear();
  }
}
