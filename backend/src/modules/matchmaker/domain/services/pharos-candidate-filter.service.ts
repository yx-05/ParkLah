import { Injectable } from '@nestjs/common';
import { LatLng } from '../../../gatekeeper/domain/ports/google-maps-routing.port';

export interface SearcherKinematicState {
  searcherId: string;
  currentCoords: LatLng;
  destCoords: LatLng;
  headingDegrees: number; // 0..360 (0 = North, 90 = East)
  speedKmh: number;
  gpsAccuracyMeters: number;
  lastHeartbeat: Date;
  status: string; // 'ACTIVE_SEARCHING'
  hasActiveOfferOrMatch?: boolean;
}

export interface PharosPruningResult {
  eligible: boolean;
  rejectReason?: string;
  bearingToSpotDeg?: number;
  angularDivergenceDeg?: number;
  euclideanDistanceMeters?: number;
}

@Injectable()
export class PharosCandidateFilterService {
  public static readonly MAX_EUCLIDEAN_RADIUS_METERS = 1500;
  public static readonly MAX_PING_STALENESS_SECONDS = 20;
  public static readonly MAX_GPS_ACCURACY_METERS = 40;
  public static readonly SPEED_THRESHOLD_KMH = 25.0;
  public static readonly DIVERGENCE_THRESHOLD_DEG = 120.0;

  /**
   * Calculates forward geodesic bearing (azimuth) from coordinate A to coordinate B in degrees [0, 360).
   */
  public calculateBearing(from: LatLng, to: LatLng): number {
    const lat1 = (from.latitude * Math.PI) / 180;
    const lat2 = (to.latitude * Math.PI) / 180;
    const dLon = ((to.longitude - from.longitude) * Math.PI) / 180;

    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

    const initialBearing = (Math.atan2(y, x) * 180) / Math.PI;
    return (initialBearing + 360) % 360;
  }

  /**
   * Computes minimal angular divergence between two angles in [0, 180] degrees.
   */
  public calculateAngularDivergence(headingA: number, headingB: number): number {
    const diff = Math.abs(headingA - headingB) % 360;
    return diff > 180 ? 360 - diff : diff;
  }

  /**
   * Calculates great-circle Haversine distance in meters between two lat/lng points.
   */
  public calculateHaversineDistance(p1: LatLng, p2: LatLng): number {
    const R = 6371000; // Earth radius in meters
    const phi1 = (p1.latitude * Math.PI) / 180;
    const phi2 = (p2.latitude * Math.PI) / 180;
    const deltaPhi = ((p2.latitude - p1.latitude) * Math.PI) / 180;
    const deltaLambda = ((p2.longitude - p1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  }

  /**
   * Executes the 4-tier Pharos candidate filter:
   * Rule 1: Active searching status & not busy
   * Rule 2: Spatial geofence check (<= 1500m Euclidean)
   * Rule 3: Kinematic heading divergence check
   * Rule 4: GPS telemetry freshness & accuracy check
   */
  public evaluateCandidate(
    searcher: SearcherKinematicState,
    spotCoords: LatLng,
    currentTime: Date = new Date(),
  ): PharosPruningResult {
    // Rule 1: Active Searching Status
    if (searcher.status !== 'ACTIVE_SEARCHING') {
      return { eligible: false, rejectReason: 'INACTIVE_STATUS' };
    }
    if (searcher.hasActiveOfferOrMatch) {
      return { eligible: false, rejectReason: 'SEARCHER_BUSY_WITH_MATCH' };
    }

    // Rule 2: Spatial Geofence Coarse Filter
    const euclideanDistance = this.calculateHaversineDistance(searcher.currentCoords, spotCoords);
    if (euclideanDistance > PharosCandidateFilterService.MAX_EUCLIDEAN_RADIUS_METERS) {
      return {
        eligible: false,
        rejectReason: 'BEYOND_MAX_RADIUS',
        euclideanDistanceMeters: euclideanDistance,
      };
    }

    // Rule 3: GPS Telemetry Freshness & Accuracy Bounds
    const stalenessSec = (currentTime.getTime() - searcher.lastHeartbeat.getTime()) / 1000;
    if (stalenessSec > PharosCandidateFilterService.MAX_PING_STALENESS_SECONDS) {
      return { eligible: false, rejectReason: 'STALE_GPS_HEARTBEAT' };
    }
    if (searcher.gpsAccuracyMeters > PharosCandidateFilterService.MAX_GPS_ACCURACY_METERS) {
      return { eligible: false, rejectReason: 'POOR_GPS_ACCURACY' };
    }

    // Rule 4: Kinematic Heading & Bearing Alignment
    const bearingToSpot = this.calculateBearing(searcher.currentCoords, spotCoords);
    const angularDivergence = this.calculateAngularDivergence(searcher.headingDegrees, bearingToSpot);

    if (
      searcher.speedKmh > PharosCandidateFilterService.SPEED_THRESHOLD_KMH &&
      angularDivergence > PharosCandidateFilterService.DIVERGENCE_THRESHOLD_DEG
    ) {
      return {
        eligible: false,
        rejectReason: 'HEADING_DIVERGENCE_AT_SPEED',
        bearingToSpotDeg: Math.round(bearingToSpot * 10) / 10,
        angularDivergenceDeg: Math.round(angularDivergence * 10) / 10,
        euclideanDistanceMeters: euclideanDistance,
      };
    }

    return {
      eligible: true,
      bearingToSpotDeg: Math.round(bearingToSpot * 10) / 10,
      angularDivergenceDeg: Math.round(angularDivergence * 10) / 10,
      euclideanDistanceMeters: euclideanDistance,
    };
  }
}
