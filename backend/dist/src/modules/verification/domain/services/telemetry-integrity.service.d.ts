import { LatLng } from '../../../gatekeeper/domain/ports/google-maps-routing.port';
export interface TelemetryHeartbeat {
    currentCoords: LatLng;
    previousCoords?: LatLng;
    timestamp: Date | number | string;
    previousTimestamp?: Date | number | string;
    speedKmh?: number;
    horizontalAccuracyMeters?: number;
    historicalCancellationRate?: number;
    unverifiedClaimRatio?: number;
}
export interface TelemetryAuditResult {
    isTrusted: boolean;
    integrityScore: number;
    flaggedReasons: string[];
    signals: {
        velocityKmh?: number;
        speedDeltaMps?: number;
        horizontalAccuracyMeters?: number;
        stalenessSeconds?: number;
    };
}
export interface HeuristicGuardRules {
    max_safe_speed_kmh: number;
    max_position_delta_mps: number;
    max_horizontal_accuracy_meters: number;
    max_ping_staleness_seconds: number;
    max_cancellation_rate: number;
    max_teleport_jump_ratio: number;
    max_unverified_claim_ratio: number;
}
export declare class TelemetryIntegrityService {
    private readonly logger;
    private rules;
    private metadata;
    constructor();
    private loadMetadata;
    auditTelemetry(heartbeat: TelemetryHeartbeat): TelemetryAuditResult;
    private haversineMeters;
}
