export const DISTRIBUTED_LOCK_PORT = Symbol('IDistributedLockPort');

export interface IDistributedLockPort {
  acquireSpotLock(spotId: string, searcherId: string, ttlMs?: number): Promise<boolean>;
  releaseSpotLock(spotId: string): Promise<void>;
  getLockHolder(spotId: string): Promise<string | null>;
}
