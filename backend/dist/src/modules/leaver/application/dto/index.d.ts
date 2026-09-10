export declare class SpotCoordinatesDto {
    latitude: number;
    longitude: number;
    accuracy?: number;
}
export declare class DepartureBroadcastDto {
    coordinates: SpotCoordinatesDto;
    countdownSeconds: number;
    vehicleId?: string;
    landmarkNote?: string;
}
export declare class CancelDepartureDto {
    reason?: string;
}
export declare class SyncCountdownDto {
    remainingSeconds: number;
}
export interface LeaverSessionData {
    leaverId: string;
    coordinates: {
        latitude: number;
        longitude: number;
    };
    countdownSeconds: number;
    remainingSeconds: number;
    vehicleId?: string;
    landmarkNote?: string;
    isMatched: boolean;
    matchedSearcherId?: string;
    broadcastAt: Date;
    expiresAt: Date;
}
