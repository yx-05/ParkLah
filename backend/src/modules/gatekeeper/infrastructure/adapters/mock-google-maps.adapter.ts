import { Injectable } from '@nestjs/common';
import {
  IGoogleMapsRoutingPort,
  LatLng,
  PlacePrediction,
  RouteMetrics,
} from '../../domain/ports/google-maps-routing.port';

@Injectable()
export class MockGoogleMapsRoutingAdapter implements IGoogleMapsRoutingPort {
  private mockedDistanceMeters: number | null = null;
  private mockedDurationSeconds: number | null = null;

  public setMockedMetrics(distanceMeters: number, durationSeconds: number): void {
    this.mockedDistanceMeters = distanceMeters;
    this.mockedDurationSeconds = durationSeconds;
  }

  public resetMocks(): void {
    this.mockedDistanceMeters = null;
    this.mockedDurationSeconds = null;
  }

  async searchPlace(query: string, proximity?: LatLng): Promise<PlacePrediction[]> {
    return [
      {
        placeId: `place_${query.toLowerCase().replace(/\s+/g, '_')}`,
        name: query,
        address: `${query}, Kuala Lumpur, Malaysia`,
        latitude: proximity ? proximity.latitude + 0.005 : 3.139,
        longitude: proximity ? proximity.longitude + 0.005 : 101.6869,
      },
    ];
  }

  async getDistanceAndEta(origin: LatLng, destination: LatLng): Promise<RouteMetrics> {
    if (this.mockedDistanceMeters !== null && this.mockedDurationSeconds !== null) {
      return {
        distanceMeters: this.mockedDistanceMeters,
        durationSeconds: this.mockedDurationSeconds,
        polyline: 'mock_encoded_polyline_points',
      };
    }

    const distanceMeters = Math.round(
      this.haversineDistance(origin.latitude, origin.longitude, destination.latitude, destination.longitude),
    );
    // Assume average urban driving speed 30 km/h = 8.33 m/s
    const durationSeconds = Math.round(distanceMeters / 8.33);

    return {
      distanceMeters,
      durationSeconds,
      polyline: 'mock_encoded_polyline_points',
    };
  }

  async getPolyline(origin: LatLng, destination: LatLng): Promise<string> {
    return 'mock_encoded_polyline_points';
  }

  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
