import { LatLng } from '../../../gatekeeper/domain/ports/google-maps-routing.port';
export interface SearcherKinematicState {
    searcherId: string;
    currentCoords: LatLng;
    destCoords: LatLng;
    headingDegrees: number;
    speedKmh: number;
    gpsAccuracyMeters: number;
    lastHeartbeat: Date;
    status: string;
    hasActiveOfferOrMatch?: boolean;
}
export interface PharosPruningResult {
    eligible: boolean;
    rejectReason?: string;
    bearingToSpotDeg?: number;
    angularDivergenceDeg?: number;
    euclideanDistanceMeters?: number;
}
export declare class PharosCandidateFilterService {
    static readonly MAX_EUCLIDEAN_RADIUS_METERS = 1500;
    static readonly MAX_PING_STALENESS_SECONDS = 20;
    static readonly MAX_GPS_ACCURACY_METERS = 40;
    static readonly SPEED_THRESHOLD_KMH = 25;
    static readonly DIVERGENCE_THRESHOLD_DEG = 120;
    calculateBearing(from: LatLng, to: LatLng): number;
    calculateAngularDivergence(headingA: number, headingB: number): number;
    calculateHaversineDistance(p1: LatLng, p2: LatLng): number;
    evaluateCandidate(searcher: SearcherKinematicState, spotCoords: LatLng, currentTime?: Date): PharosPruningResult;
}
