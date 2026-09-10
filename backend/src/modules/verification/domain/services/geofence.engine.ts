import { Injectable } from '@nestjs/common';
import { LatLng } from '../../../gatekeeper/domain/ports/google-maps-routing.port';

export interface DriverTelemetry {
  coordinates: LatLng;
  speedKmh: number; // in km/h
  stationaryDurationSeconds: number; // duration vehicle has been stationary
}

export interface GeofenceEvaluationResult {
  isWithinGeofence: boolean;
  distanceMeters: number;
  isStationary: boolean;
  isArrivalTriggered: boolean;
}

@Injectable()
export class GeofenceEngine {
  public static readonly MAX_GEOFENCE_RADIUS_METERS = 30.0;
  public static readonly MAX_STATIONARY_SPEED_KMH = 0.5;
  public static readonly MIN_STATIONARY_DURATION_SECONDS = 15;

  public calculateDistanceMeters(loc1: LatLng, loc2: LatLng): number {
    const R = 6371000; // Earth radius in meters
    const dLat = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
    const dLon = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((loc1.latitude * Math.PI) / 180) *
        Math.cos((loc2.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  public isWithinGeofence(driverLoc: LatLng, spotLoc: LatLng): boolean {
    const distance = this.calculateDistanceMeters(driverLoc, spotLoc);
    return distance <= GeofenceEngine.MAX_GEOFENCE_RADIUS_METERS;
  }

  public evaluateArrivalCondition(
    telemetry: DriverTelemetry,
    spotLoc: LatLng,
  ): GeofenceEvaluationResult {
    const distanceMeters = this.calculateDistanceMeters(telemetry.coordinates, spotLoc);
    const isWithinGeofence = distanceMeters <= GeofenceEngine.MAX_GEOFENCE_RADIUS_METERS;

    const isStationary =
      telemetry.speedKmh <= GeofenceEngine.MAX_STATIONARY_SPEED_KMH &&
      telemetry.stationaryDurationSeconds >= GeofenceEngine.MIN_STATIONARY_DURATION_SECONDS;

    const isArrivalTriggered = isWithinGeofence && isStationary;

    return {
      isWithinGeofence,
      distanceMeters,
      isStationary,
      isArrivalTriggered,
    };
  }
}
