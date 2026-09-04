export declare const DISTRIBUTED_LOCK_PORT: unique symbol;
export interface IDistributedLockPort {
    acquireSpotLock(spotId: string, searcherId: string, ttlMs?: number): Promise<boolean>;
    releaseSpotLock(spotId: string): Promise<void>;
    getLockHolder(spotId: string): Promise<string | null>;
}
