import { IGoogleMapsRoutingPort, LatLng, PlacePrediction, RouteMetrics } from '../../domain/ports/google-maps-routing.port';
export declare class MockGoogleMapsRoutingAdapter implements IGoogleMapsRoutingPort {
    private mockedDistanceMeters;
    private mockedDurationSeconds;
    setMockedMetrics(distanceMeters: number, durationSeconds: number): void;
    resetMocks(): void;
    searchPlace(query: string, proximity?: LatLng): Promise<PlacePrediction[]>;
    getDistanceAndEta(origin: LatLng, destination: LatLng): Promise<RouteMetrics>;
    getPolyline(origin: LatLng, destination: LatLng): Promise<string>;
    private haversineDistance;
}
