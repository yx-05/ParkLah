import { Injectable } from '@nestjs/common';
import { ILeaverSpatialRepositoryPort } from '../../domain/ports/leaver-spatial-repository.port';
import { LeaverSessionData } from '../../application/dto';

@Injectable()
export class InMemoryLeaverSpatialRepository implements ILeaverSpatialRepositoryPort {
  private leavers = new Map<string, LeaverSessionData>();

  async registerActiveLeaver(session: LeaverSessionData): Promise<LeaverSessionData> {
    this.leavers.set(session.leaverId, session);
    return session;
  }

  async updateCountdown(leaverId: string, remainingSeconds: number): Promise<void> {
    const session = this.leavers.get(leaverId);
    if (session) {
      session.remainingSeconds = remainingSeconds;
    }
  }

  async markMatched(leaverId: string, searcherId: string): Promise<void> {
    const session = this.leavers.get(leaverId);
    if (session) {
      session.isMatched = true;
      session.matchedSearcherId = searcherId;
    }
  }

  async removeActiveLeaver(leaverId: string): Promise<boolean> {
    return this.leavers.delete(leaverId);
  }

  async getLeaverSession(leaverId: string): Promise<LeaverSessionData | null> {
    const session = this.leavers.get(leaverId);
    if (!session) return null;
    if (Date.now() > session.expiresAt.getTime()) {
      this.leavers.delete(leaverId);
      return null;
    }
    return session;
  }

  async findNearbyActiveLeavers(
    latitude: number,
    longitude: number,
    radiusMeters = 1000,
  ): Promise<Array<{ session: LeaverSessionData; distanceMeters: number }>> {
    const results: Array<{ session: LeaverSessionData; distanceMeters: number }> = [];

    for (const session of this.leavers.values()) {
      if (session.isMatched || Date.now() > session.expiresAt.getTime()) {
        continue;
      }

      const dist = this.haversineDistance(
        latitude,
        longitude,
        session.coordinates.latitude,
        session.coordinates.longitude,
      );

      if (dist <= radiusMeters) {
        results.push({ session, distanceMeters: Math.round(dist) });
      }
    }

    return results.sort((a, b) => a.distanceMeters - b.distanceMeters);
  }

  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  public clear(): void {
    this.leavers.clear();
  }
}
