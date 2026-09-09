import { Injectable, Logger } from '@nestjs/common';
import {
  IRoadRoutingPort,
  CandidateOrigin,
  RouteMatrixResult,
} from '../../domain/ports/road-routing.port';
import { LatLng } from '../../../gatekeeper/domain/ports/google-maps-routing.port';

@Injectable()
export class OsrmRoadRoutingAdapter implements IRoadRoutingPort {
  private readonly logger = new Logger(OsrmRoadRoutingAdapter.name);
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(baseUrl?: string, timeoutMs = 4000) {
    this.baseUrl = (baseUrl || process.env.OSRM_BASE_URL || 'https://router.project-osrm.org').replace(/\/$/, '');
    this.timeoutMs = timeoutMs;
  }

  async calculateCandidateRoutes(
    spotCoords: LatLng,
    candidates: CandidateOrigin[],
  ): Promise<RouteMatrixResult[]> {
    if (candidates.length === 0) {
      return [];
    }

    try {
      return await this.queryOsrmTable(spotCoords, candidates);
    } catch (error: any) {
      this.logger.warn(
        `OSRM table routing failed or timed out (${error.message}). Falling back to urban Haversine estimation.`,
      );
      return this.fallbackHaversineRoutes(spotCoords, candidates);
    }
  }

  /**
   * Queries OSRM Table Service:
   * /table/v1/driving/{spot_lon},{spot_lat};{c1_lon},{c1_lat};...
   * destinations=0&sources=1;2;...&annotations=duration,distance
   */
  private async queryOsrmTable(
    spotCoords: LatLng,
    candidates: CandidateOrigin[],
  ): Promise<RouteMatrixResult[]> {
    // Index 0 is the parking spot destination
    const coordsList = [
      `${spotCoords.longitude},${spotCoords.latitude}`,
      ...candidates.map((c) => `${c.coords.longitude},${c.coords.latitude}`),
    ].join(';');

    const sourcesIndices = candidates.map((_, i) => i + 1).join(';');
    const url = `${this.baseUrl}/table/v1/driving/${coordsList}?sources=${sourcesIndices}&destinations=0&annotations=duration,distance`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OSRM HTTP error: ${response.status} ${response.statusText}`);
    }

    const data: any = await response.json();
    if (data.code !== 'Ok' || !data.durations || !data.distances) {
      throw new Error(`OSRM response code: ${data.code}`);
    }

    return candidates.map((candidate, idx) => {
      // duration in seconds, distance in meters
      const durationSeconds = data.durations[idx] ? data.durations[idx][0] : null;
      const distanceMeters = data.distances[idx] ? data.distances[idx][0] : null;

      if (durationSeconds === null || distanceMeters === null) {
        // Fallback for isolated disconnected road points
        return this.singleHaversineEstimate(spotCoords, candidate);
      }

      return {
        searcherId: candidate.searcherId,
        roadDistanceMeters: Math.round(distanceMeters),
        roadEtaSeconds: Math.round(durationSeconds),
        routingSource: 'OSRM' as const,
      };
    });
  }

  private fallbackHaversineRoutes(
    spotCoords: LatLng,
    candidates: CandidateOrigin[],
  ): RouteMatrixResult[] {
    return candidates.map((candidate) => this.singleHaversineEstimate(spotCoords, candidate));
  }

  private singleHaversineEstimate(
    spotCoords: LatLng,
    candidate: CandidateOrigin,
  ): RouteMatrixResult {
    const R = 6371000;
    const phi1 = (candidate.coords.latitude * Math.PI) / 180;
    const phi2 = (spotCoords.latitude * Math.PI) / 180;
    const deltaPhi = ((spotCoords.latitude - candidate.coords.latitude) * Math.PI) / 180;
    const deltaLambda = ((spotCoords.longitude - candidate.coords.longitude) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const euclidMeters = Math.round(R * c);

    // Urban road detour multiplier ~ 1.35x
    const roadDistanceMeters = Math.round(euclidMeters * 1.35);
    // Average urban speed ~ 22 km/h = 6.11 m/s
    const roadEtaSeconds = Math.max(15, Math.round(roadDistanceMeters / 6.11));

    return {
      searcherId: candidate.searcherId,
      roadDistanceMeters,
      roadEtaSeconds,
      routingSource: 'HAVERSINE_FALLBACK' as const,
    };
  }
}
