import * as Location from 'expo-location';
import { LocationService } from '../services/LocationService';

// Mock expo-location module
jest.mock('expo-location', () => ({
  Accuracy: {
    Lowest: 1,
    Low: 2,
    Balanced: 3,
    High: 4,
    Highest: 5,
    BestForNavigation: 6,
  },
  getForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({
    coords: {
      latitude: 3.139,
      longitude: 101.686,
      accuracy: 5,
      altitude: 10,
      heading: 90,
      speed: 12.5,
    },
    timestamp: 1672531200000,
  }),
  watchPositionAsync: jest.fn().mockImplementation((options, callback) => {
    return Promise.resolve({
      remove: jest.fn(),
    });
  }),
}));

describe('LocationService (Module 1 Unit Tests)', () => {
  let locationService: LocationService;

  beforeEach(() => {
    jest.clearAllMocks();
    locationService = LocationService.getInstance();
    locationService.stopTracking();
  });

  it('should be a singleton instance', () => {
    const instance1 = LocationService.getInstance();
    const instance2 = LocationService.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should request permissions and return true when granted', async () => {
    const granted = await locationService.requestPermissions();
    expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled();
    expect(granted).toBe(true);
  });

  it('should get current position with telemetry properties', async () => {
    const pos = await locationService.getCurrentPosition();
    expect(Location.getCurrentPositionAsync).toHaveBeenCalledWith({
      accuracy: Location.Accuracy.BestForNavigation,
      mayShowUserSettingsDialog: true,
    });
    expect(pos.latitude).toBe(3.139);
    expect(pos.longitude).toBe(101.686);
    expect(pos.speed).toBe(12.5);
    expect(pos.heading).toBe(90);
  });

  describe('Adaptive Interval Switching', () => {
    it('should switch to IDLE mode with 60s interval and lowest accuracy', async () => {
      await locationService.setTrackingMode('IDLE');
      expect(Location.watchPositionAsync).toHaveBeenCalledWith(
        {
          accuracy: Location.Accuracy.Lowest,
          timeInterval: 60000,
          distanceInterval: 50,
        },
        expect.any(Function),
      );
    });

    it('should switch to GATEKEEPER_LOCKED mode with 10s interval and balanced accuracy', async () => {
      await locationService.setTrackingMode('GATEKEEPER_LOCKED');
      expect(Location.watchPositionAsync).toHaveBeenCalledWith(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 10000,
          distanceInterval: 20,
        },
        expect.any(Function),
      );
    });

    it('should switch to ACTIVE_SEARCH mode with 3s interval and highest accuracy', async () => {
      await locationService.setTrackingMode('ACTIVE_SEARCH');
      expect(Location.watchPositionAsync).toHaveBeenCalledWith(
        {
          accuracy: Location.Accuracy.Highest,
          timeInterval: 3000,
          distanceInterval: 5,
        },
        expect.any(Function),
      );
    });

    it('should switch to NAVIGATING mode with 3s interval and highest accuracy', async () => {
      await locationService.setTrackingMode('NAVIGATING');
      expect(Location.watchPositionAsync).toHaveBeenCalledWith(
        {
          accuracy: Location.Accuracy.Highest,
          timeInterval: 3000,
          distanceInterval: 5,
        },
        expect.any(Function),
      );
    });

    it('should notify location update listeners on position updates', async () => {
      let watchCallback: ((loc: any) => void) | null = null;
      (Location.watchPositionAsync as jest.Mock).mockImplementationOnce((options, callback) => {
        watchCallback = callback;
        return Promise.resolve({ remove: jest.fn() });
      });

      const listener = jest.fn();
      const unsubscribe = locationService.onLocationUpdate(listener);

      await locationService.setTrackingMode('ACTIVE_SEARCH');
      expect(watchCallback).toBeTruthy();

      // Trigger location update
      watchCallback!({
        coords: {
          latitude: 3.14,
          longitude: 101.69,
          accuracy: 4,
          heading: 180,
          speed: 15,
        },
        timestamp: 1672531300000,
      });

      expect(listener).toHaveBeenCalledWith({
        latitude: 3.14,
        longitude: 101.69,
        accuracy: 4,
        heading: 180,
        speed: 15,
        timestamp: 1672531300000,
      });

      // Unsubscribe
      unsubscribe();
      watchCallback!({
        coords: { latitude: 3.15, longitude: 101.70 },
        timestamp: 1672531400000,
      });
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should remove existing subscription and reset on stopTracking', async () => {
      const mockRemove = jest.fn();
      (Location.watchPositionAsync as jest.Mock).mockResolvedValueOnce({
        remove: mockRemove,
      });

      await locationService.setTrackingMode('ACTIVE_SEARCH');
      locationService.stopTracking();

      expect(mockRemove).toHaveBeenCalled();
    });
  });
});
