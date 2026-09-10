import { LatLng } from '../../../gatekeeper/domain/ports/google-maps-routing.port';
export declare const ROAD_ROUTING_PORT: unique symbol;
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
    calculateCandidateRoutes(spotCoords: LatLng, candidates: CandidateOrigin[]): Promise<RouteMatrixResult[]>;
}
