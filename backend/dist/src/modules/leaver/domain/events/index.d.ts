export declare class LeaverBroadcastedEvent {
    readonly leaverId: string;
    readonly coordinates: {
        latitude: number;
        longitude: number;
    };
    readonly countdownSeconds: number;
    readonly vehicleSummary?: {
        makeModel: string;
        color: string;
        plateSuffix: string;
    };
    readonly landmarkNote?: string;
    readonly timestamp: Date;
    constructor(leaverId: string, coordinates: {
        latitude: number;
        longitude: number;
    }, countdownSeconds: number, vehicleSummary?: {
        makeModel: string;
        color: string;
        plateSuffix: string;
    }, landmarkNote?: string, timestamp?: Date);
}
export declare class LeaverCancelledEvent {
    readonly leaverId: string;
    readonly reason: string;
    readonly remainingSeconds: number;
    readonly isMatched: boolean;
    readonly timestamp: Date;
    constructor(leaverId: string, reason: string, remainingSeconds: number, isMatched: boolean, timestamp?: Date);
}
