import { LatLng } from '../../../gatekeeper/domain/ports/google-maps-routing.port';
export interface DriverTelemetry {
    coordinates: LatLng;
    speedKmh: number;
    stationaryDurationSeconds: number;
}
export interface GeofenceEvaluationResult {
    isWithinGeofence: boolean;
    distanceMeters: number;
    isStationary: boolean;
    isArrivalTriggered: boolean;
}
export declare class GeofenceEngine {
    static readonly MAX_GEOFENCE_RADIUS_METERS = 30;
    static readonly MAX_STATIONARY_SPEED_KMH = 0.5;
    static readonly MIN_STATIONARY_DURATION_SECONDS = 15;
    calculateDistanceMeters(loc1: LatLng, loc2: LatLng): number;
    isWithinGeofence(driverLoc: LatLng, spotLoc: LatLng): boolean;
    evaluateArrivalCondition(telemetry: DriverTelemetry, spotLoc: LatLng): GeofenceEvaluationResult;
}
