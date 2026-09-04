import * as Location from 'expo-location';
import { TelemetryLocation } from '../types';

export type TrackingMode = 'IDLE' | 'GATEKEEPER_LOCKED' | 'ACTIVE_SEARCH' | 'NAVIGATING';

export class LocationService {
  private static instance: LocationService;
  private subscription: Location.LocationSubscription | null = null;
  private listeners: Array<(location: TelemetryLocation) => void> = [];
  private currentMode: TrackingMode = 'IDLE';

  private constructor() {}

  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  public async requestPermissions(): Promise<boolean> {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      return foregroundStatus === 'granted';
    } catch {
      return false;
    }
  }

  public async getCurrentPosition(): Promise<TelemetryLocation> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return {
          latitude: 3.1176,
          longitude: 101.6778,
          timestamp: Date.now(),
        };
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
        mayShowUserSettingsDialog: true,
      });

      return {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        accuracy: loc.coords.accuracy ?? undefined,
        heading: loc.coords.heading ?? undefined,
        speed: loc.coords.speed ?? undefined,
        timestamp: loc.timestamp,
      };
    } catch (e) {
      // Fallback location on error or denial
      return {
        latitude: 3.1176,
        longitude: 101.6778,
        timestamp: Date.now(),
      };
    }
  }

  public async setTrackingMode(mode: TrackingMode): Promise<void> {
    if (this.currentMode === mode && this.subscription) return;
    this.currentMode = mode;

    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      return;
    }

    let accuracy = Location.Accuracy.Balanced;
    let timeInterval = 10000; // 10s
    let distanceInterval = 10;

    switch (mode) {
      case 'IDLE':
        timeInterval = 60000; // 60s
        distanceInterval = 50;
        accuracy = Location.Accuracy.Lowest;
        break;
      case 'GATEKEEPER_LOCKED':
        timeInterval = 10000; // 10s
        distanceInterval = 20;
        accuracy = Location.Accuracy.Balanced;
        break;
      case 'ACTIVE_SEARCH':
      case 'NAVIGATING':
        timeInterval = 3000; // 3s
        distanceInterval = 5;
        accuracy = Location.Accuracy.Highest;
        break;
    }

    try {
      this.subscription = await Location.watchPositionAsync(
        {
          accuracy,
          timeInterval,
          distanceInterval,
        },
        (loc) => {
          const telemetry: TelemetryLocation = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            accuracy: loc.coords.accuracy ?? undefined,
            heading: loc.coords.heading ?? undefined,
            speed: loc.coords.speed ?? undefined,
            timestamp: loc.timestamp,
          };
          this.notifyListeners(telemetry);
        },
      );
    } catch (e) {
      // Gracefully handle watch error
    }
  }

  public onLocationUpdate(callback: (location: TelemetryLocation) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notifyListeners(telemetry: TelemetryLocation): void {
    for (const listener of this.listeners) {
      listener(telemetry);
    }
  }

  public startLocationUpdates(mode: TrackingMode = 'ACTIVE_SEARCH'): Promise<void> {
    return this.setTrackingMode(mode);
  }

  public getCurrentLocation(): Promise<TelemetryLocation> {
    return this.getCurrentPosition();
  }

  public subscribe(callback: (location: TelemetryLocation) => void): () => void {
    return this.onLocationUpdate(callback);
  }

  public stopTracking(): void {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
    this.currentMode = 'IDLE';
  }
}
