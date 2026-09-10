import { IDistributedLockPort } from '../../domain/ports/distributed-lock.port';
export declare class InMemoryLockAdapter implements IDistributedLockPort {
    private locks;
    acquireSpotLock(spotId: string, searcherId: string, ttlMs?: number): Promise<boolean>;
    releaseSpotLock(spotId: string): Promise<void>;
    getLockHolder(spotId: string): Promise<string | null>;
    clear(): void;
}
