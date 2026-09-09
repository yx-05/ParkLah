import { LatLng } from '../../../gatekeeper/domain/ports/google-maps-routing.port';

export const ROAD_ROUTING_PORT = Symbol('IRoadRoutingPort');

export interface CandidateOrigin {
  searcherId: string;
  coords: LatLng;
}

export interface RouteMatrixResult {
  searcherId: string;
  roadDistanceMeters: number;
  roadEtaSeconds: number;
  routingSource: 'OSRM' | 'GOOGLE_MATRIX' | 'HAVERSINE_FALLBACK';
}

export interface IRoadRoutingPort {
  /**
   * Calculates driving road-network distance and ETA for multiple candidate origins
   * to a single parking destination using batch table routing.
   */
  calculateCandidateRoutes(
    spotCoords: LatLng,
    candidates: CandidateOrigin[],
  ): Promise<RouteMatrixResult[]>;
}
