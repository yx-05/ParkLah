export declare const GOOGLE_MAPS_ROUTING_PORT: unique symbol;
export interface LatLng {
    latitude: number;
    longitude: number;
}
export interface PlacePrediction {
    placeId: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
}
export interface RouteMetrics {
    distanceMeters: number;
    durationSeconds: number;
    polyline: string;
}
export interface IGoogleMapsRoutingPort {
    searchPlace(query: string, proximity?: LatLng): Promise<PlacePrediction[]>;
    getDistanceAndEta(origin: LatLng, destination: LatLng): Promise<RouteMetrics>;
    getPolyline(origin: LatLng, destination: LatLng): Promise<string>;
}
