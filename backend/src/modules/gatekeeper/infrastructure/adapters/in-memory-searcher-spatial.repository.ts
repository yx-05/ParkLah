import { Injectable } from '@nestjs/common';
import {
  ISearcherSpatialRepositoryPort,
  ActiveSearcherSession,
} from '../../domain/ports/searcher-spatial-repository.port';
import { LatLng } from '../../domain/ports/google-maps-routing.port';

@Injectable()
export class InMemorySearcherSpatialRepository implements ISearcherSpatialRepositoryPort {
  private activeSearchers = new Map<string, ActiveSearcherSession>();

  async registerActiveSearcher(
    searcherId: string,
    currentCoords: LatLng,
    destCoords: LatLng,
    destName: string,
    radiusMeters = 1000,
  ): Promise<ActiveSearcherSession> {
    const session: ActiveSearcherSession = {
      searcherId,
      currentCoords,
      destCoords,
      destName,
      radiusMeters,
      registeredAt: new Date(),
      lastHeartbeat: new Date(),
    };
    this.activeSearchers.set(searcherId, session);
    return session;
  }

  async updateSearcherLocation(searcherId: string, coords: LatLng): Promise<void> {
    const session = this.activeSearchers.get(searcherId);
    if (session) {
      session.currentCoords = coords;
      session.lastHeartbeat = new Date();
    }
  }

  async removeActiveSearcher(searcherId: string): Promise<boolean> {
    return this.activeSearchers.delete(searcherId);
  }

  async getActiveSearcherState(searcherId: string): Promise<ActiveSearcherSession | null> {
    return this.activeSearchers.get(searcherId) || null;
  }

  async findNearbyActiveSearchers(
    spotCoords: LatLng,
    radiusMeters = 1000,
  ): Promise<Array<{ searcher: ActiveSearcherSession; distanceMeters: number }>> {
    const results: Array<{ searcher: ActiveSearcherSession; distanceMeters: number }> = [];

    for (const searcher of this.activeSearchers.values()) {
      const distToSpot = this.haversineDistance(
        searcher.currentCoords.latitude,
        searcher.currentCoords.longitude,
        spotCoords.latitude,
        spotCoords.longitude,
      );

      if (distToSpot <= radiusMeters) {
        results.push({ searcher, distanceMeters: Math.round(distToSpot) });
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
    this.activeSearchers.clear();
  }
}
