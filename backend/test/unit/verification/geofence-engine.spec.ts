import { GeofenceEngine } from '../../../src/modules/verification/domain/services/geofence.engine';

describe('GeofenceEngine (Module 7 Unit Tests)', () => {
  let geofenceEngine: GeofenceEngine;
  const spotLoc = { latitude: 3.1390, longitude: 101.6869 };

  beforeEach(() => {
    geofenceEngine = new GeofenceEngine();
  });

  it('should trigger arrival when driver is within 30m, speed <= 0.5 km/h, and stationary >= 15s', () => {
    // 15m offset (~0.0001 deg latitude)
    const driverLoc = { latitude: 3.1391, longitude: 101.6869 };

    const result = geofenceEngine.evaluateArrivalCondition(
      {
        coordinates: driverLoc,
        speedKmh: 0.0,
        stationaryDurationSeconds: 16,
      },
      spotLoc,
    );

    expect(result.isWithinGeofence).toBe(true);
    expect(result.distanceMeters).toBeLessThanOrEqual(30.0);
    expect(result.isStationary).toBe(true);
    expect(result.isArrivalTriggered).toBe(true);
  });

  it('should suppress arrival when vehicle is moving at 30 km/h even if within 15m', () => {
    const driverLoc = { latitude: 3.1391, longitude: 101.6869 };

    const result = geofenceEngine.evaluateArrivalCondition(
      {
        coordinates: driverLoc,
        speedKmh: 30.0, // Driving past the stall
        stationaryDurationSeconds: 0,
      },
      spotLoc,
    );

    expect(result.isWithinGeofence).toBe(true);
    expect(result.isStationary).toBe(false);
    expect(result.isArrivalTriggered).toBe(false);
  });

  it('should suppress arrival when vehicle is stationary but outside the 30m geofence (e.g. 50m)', () => {
    // ~55m offset (~0.0005 deg)
    const driverLoc = { latitude: 3.1395, longitude: 101.6869 };

    const result = geofenceEngine.evaluateArrivalCondition(
      {
        coordinates: driverLoc,
        speedKmh: 0.0,
        stationaryDurationSeconds: 20,
      },
      spotLoc,
    );

    expect(result.isWithinGeofence).toBe(false);
    expect(result.distanceMeters).toBeGreaterThan(30.0);
    expect(result.isArrivalTriggered).toBe(false);
  });
});
