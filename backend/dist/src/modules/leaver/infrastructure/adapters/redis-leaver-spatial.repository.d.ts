import Redis from 'ioredis';
import { ILeaverSpatialRepositoryPort } from '../../domain/ports/leaver-spatial-repository.port';
import { LeaverSessionData } from '../../application/dto';
export declare class RedisLeaverSpatialRepository implements ILeaverSpatialRepositoryPort {
    private redis;
    private readonly GEO_KEY;
    private readonly STATE_PREFIX;
    constructor(redisClient?: Redis);
    registerActiveLeaver(session: LeaverSessionData): Promise<LeaverSessionData>;
    updateCountdown(leaverId: string, remainingSeconds: number): Promise<void>;
    markMatched(leaverId: string, searcherId: string): Promise<void>;
    removeActiveLeaver(leaverId: string): Promise<boolean>;
    getLeaverSession(leaverId: string): Promise<LeaverSessionData | null>;
    findNearbyActiveLeavers(latitude: number, longitude: number, radiusMeters?: number): Promise<Array<{
        session: LeaverSessionData;
        distanceMeters: number;
    }>>;
}
