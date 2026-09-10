import Redis from 'ioredis';
import { IDistributedLockPort } from '../../domain/ports/distributed-lock.port';
export declare class RedisDistributedLockAdapter implements IDistributedLockPort {
    private redis;
    constructor(redisClient?: Redis);
    acquireSpotLock(spotId: string, searcherId: string, ttlMs?: number): Promise<boolean>;
    releaseSpotLock(spotId: string): Promise<void>;
    getLockHolder(spotId: string): Promise<string | null>;
}
