import { TelemetryIntegrityService } from '../../../src/modules/verification/domain/services/telemetry-integrity.service';

describe('TelemetryIntegrityService (Pitch Day Task 3.1 Unit Tests)', () => {
  let service: TelemetryIntegrityService;

  beforeEach(() => {
    service = new TelemetryIntegrityService();
  });

  it('should trust a normal valid driver telemetry heartbeat', () => {
    const result = service.auditTelemetry({
      currentCoords: { latitude: 3.1176, longitude: 101.6778 },
      previousCoords: { latitude: 3.1175, longitude: 101.6777 },
      timestamp: Date.now() - 2000, // 2s ago
      previousTimestamp: Date.now() - 5000, // 5s ago (3s delta)
      speedKmh: 35.0,
      horizontalAccuracyMeters: 8.5,
      historicalCancellationRate: 0.04,
      unverifiedClaimRatio: 0.01,
    });

    expect(result.isTrusted).toBe(true);
    expect(result.integrityScore).toBeGreaterThanOrEqual(0.95);
    expect(result.flaggedReasons).toHaveLength(0);
    expect(result.signals.velocityKmh).toBe(35.0);
  });

  it('should flag Rule 1: Instantaneous velocity exceeding 140 km/h', () => {
    const result = service.auditTelemetry({
      currentCoords: { latitude: 3.1176, longitude: 101.6778 },
      timestamp: Date.now() - 1000,
      speedKmh: 185.0, // > 140 km/h
      horizontalAccuracyMeters: 10.0,
    });

    expect(result.isTrusted).toBe(false);
    expect(result.integrityScore).toBeLessThan(0.7);
    expect(result.flaggedReasons.some((r) => r.includes('ANOMALOUS_VELOCITY_EXCEEDED'))).toBe(true);
  });

  it('should flag Rule 2: Coordinate displacement rate exceeding 40 m/s (teleportation jump)', () => {
    const result = service.auditTelemetry({
      currentCoords: { latitude: 3.1400, longitude: 101.6900 }, // ~2.5km away in 2s
      previousCoords: { latitude: 3.1176, longitude: 101.6778 },
      timestamp: Date.now() - 1000,
      previousTimestamp: Date.now() - 3000, // 2s delta -> >1000 m/s
      speedKmh: 40.0,
      horizontalAccuracyMeters: 12.0,
    });

    expect(result.isTrusted).toBe(false);
    expect(result.flaggedReasons.some((r) => r.includes('TELEPORTATION_JUMP_DETECTED'))).toBe(true);
  });

  it('should flag Rule 3: GPS Horizontal Accuracy exceeding 50 meters', () => {
    const result = service.auditTelemetry({
      currentCoords: { latitude: 3.1176, longitude: 101.6778 },
      timestamp: Date.now() - 1500,
      speedKmh: 25.0,
      horizontalAccuracyMeters: 85.0, // > 50m
    });

    expect(result.isTrusted).toBe(false);
    expect(result.flaggedReasons.some((r) => r.includes('GPS_DILUTION_OF_PRECISION_HIGH'))).toBe(true);
  });

  it('should flag Rule 4: Timestamp staleness exceeding 25 seconds', () => {
    const result = service.auditTelemetry({
      currentCoords: { latitude: 3.1176, longitude: 101.6778 },
      timestamp: Date.now() - 40000, // 40s ago > 25s
      speedKmh: 30.0,
      horizontalAccuracyMeters: 8.0,
    });

    expect(result.isTrusted).toBe(false);
    expect(result.flaggedReasons.some((r) => r.includes('TELEMETRY_STALENESS_EXCEEDED'))).toBe(true);
  });

  it('should flag abusive cancellation bots (> 60% cancellation rate)', () => {
    const result = service.auditTelemetry({
      currentCoords: { latitude: 3.1176, longitude: 101.6778 },
      timestamp: Date.now() - 2000,
      speedKmh: 20.0,
      horizontalAccuracyMeters: 6.0,
      historicalCancellationRate: 0.85, // 85% > 60%
    });

    expect(result.isTrusted).toBe(false);
    expect(result.flaggedReasons.some((r) => r.includes('HIGH_CANCELLATION_ABUSE_RISK'))).toBe(true);
  });
});
