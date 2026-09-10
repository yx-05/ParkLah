export declare class CreateProbabilisticSpotDto {
    leaverId?: string;
    latitude: number;
    longitude: number;
    areaTrafficMultiplier?: number;
    landmarkNote?: string;
}
export declare class QueryCandidateSpotsDto {
    latitude: number;
    longitude: number;
    radiusMeters?: number;
}
