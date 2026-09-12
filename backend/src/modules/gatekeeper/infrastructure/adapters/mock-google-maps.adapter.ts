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
    const baseLat = proximity ? proximity.latitude : 3.1176;
    const baseLng = proximity ? proximity.longitude : 101.6778;
    const cleanQuery = query && query.trim().length > 0 ? query.trim() : 'Parking';
    const tag = cleanQuery.toLowerCase().replace(/\s+/g, '_');

    const KNOWN_DESTINATIONS: { name: string; address: string; latitude: number; longitude: number }[] = [
      { name: 'Mid Valley Megamall', address: 'Lingkaran Syed Putra, Mid Valley City, 59200 Kuala Lumpur', latitude: 3.1176, longitude: 101.6778 },
      { name: 'Pavilion Kuala Lumpur', address: '168 Jalan Bukit Bintang, 55100 Kuala Lumpur', latitude: 3.1488, longitude: 101.7133 },
      { name: 'Suria KLCC', address: '241 Suria KLCC, Kuala Lumpur City Centre, 50088 Kuala Lumpur', latitude: 3.1578, longitude: 101.7120 },
      { name: '1 Utama Shopping Centre', address: '1 Lebuh Bandar Utama, Bandar Utama, 47800 Petaling Jaya', latitude: 3.1502, longitude: 101.6152 },
      { name: 'Sunway Pyramid', address: '3 Jalan PJS 11/15, Bandar Sunway, 47500 Subang Jaya', latitude: 3.0733, longitude: 101.6074 },
      { name: 'KL Sentral', address: 'Kuala Lumpur Sentral, Brickfields, 50470 Kuala Lumpur', latitude: 3.1342, longitude: 101.6861 },
      { name: 'The Exchange TRX', address: 'Persiaran TRX, Tun Razak Exchange, 55188 Kuala Lumpur', latitude: 3.1428, longitude: 101.7191 },
      { name: 'IOI City Mall', address: 'Lebuh IRC, IOI Resort City, 62502 Putrajaya', latitude: 2.9702, longitude: 101.7144 },
      { name: 'Bukit Bintang', address: 'Bukit Bintang, 55100 Kuala Lumpur', latitude: 3.1466, longitude: 101.7112 },
      { name: 'Bangsar Village', address: '1 Jalan Telawi 1, Bangsar, 59100 Kuala Lumpur', latitude: 3.1303, longitude: 101.6710 },
      { name: 'Batu Caves', address: 'Gombak, 68100 Batu Caves, Selangor', latitude: 3.2379, longitude: 101.6840 },
    ];

    const matches = KNOWN_DESTINATIONS.filter((item) =>
      item.name.toLowerCase().includes(cleanQuery.toLowerCase()) ||
      item.address.toLowerCase().includes(cleanQuery.toLowerCase())
    );

    if (matches.length > 0) {
      return matches.map((m, idx) => ({
        placeId: `known_place_${idx}_${m.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        name: m.name,
        address: m.address,
        latitude: m.latitude,
        longitude: m.longitude,
      }));
    }

    return [
      {
        placeId: `place_${tag}_1`,
        name: `${cleanQuery} Premier Bay 12`,
        address: 'Direct Lift Lobby Access, Level 1',
        latitude: baseLat + 0.0022,
        longitude: baseLng + 0.0028,
      },
      {
        placeId: `place_${tag}_2`,
        name: `${cleanQuery} Covered Bay B2-45`,
        address: 'Near Main Escalator, Basement 2',
        latitude: baseLat - 0.0045,
        longitude: baseLng + 0.0038,
      },
      {
        placeId: `place_${tag}_3`,
        name: `${cleanQuery} Executive Valet Bay`,
        address: 'Main Entrance Lobby, Ground Floor',
        latitude: baseLat + 0.0075,
        longitude: baseLng - 0.0065,
      },
      {
        placeId: `place_${tag}_4`,
        name: `${cleanQuery} EV Charging Bay 04`,
        address: 'Green Zone Pillar C-12, Level 2',
        latitude: baseLat - 0.0032,
        longitude: baseLng - 0.0040,
      },
      {
        placeId: `place_${tag}_5`,
        name: `${cleanQuery} Express Bay W3`,
        address: 'West Wing Entrance, Ground Floor',
        latitude: baseLat + 0.0110,
        longitude: baseLng + 0.0095,
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
