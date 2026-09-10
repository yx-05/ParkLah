import { IGoogleMapsRoutingPort, LatLng, PlacePrediction, RouteMetrics } from '../../domain/ports/google-maps-routing.port';
export declare class GoogleMapsRoutingAdapter implements IGoogleMapsRoutingPort {
    private readonly logger;
    private readonly fallbackAdapter;
    private readonly apiKey;
    constructor();
    searchPlace(query: string, proximity?: LatLng): Promise<PlacePrediction[]>;
    getDistanceAndEta(origin: LatLng, destination: LatLng): Promise<RouteMetrics>;
    getPolyline(origin: LatLng, destination: LatLng): Promise<string>;
}
