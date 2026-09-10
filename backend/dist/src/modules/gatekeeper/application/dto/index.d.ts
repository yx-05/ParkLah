export declare class LatLngDto {
    latitude: number;
    longitude: number;
}
export declare class DestinationTargetDto extends LatLngDto {
    placeId?: string;
    name: string;
}
export declare class EvaluateDestinationDto {
    origin: LatLngDto;
    destination: DestinationTargetDto;
}
export declare class StartSearchDto {
    destCoords: LatLngDto;
    destName: string;
    radiusMeters?: number;
}
export declare class SearchPlacesQueryDto {
    query: string;
    proximityLat?: number;
    proximityLng?: number;
}
export interface GatekeeperEvaluationResult {
    isUnlocked: boolean;
    distanceMeters: number;
    durationSeconds: number;
    polyline: string;
    unlockThreshold: string;
    reason?: string;
}
