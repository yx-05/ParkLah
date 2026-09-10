import { Injectable } from '@nestjs/common';
import { IDistributedLockPort } from '../../domain/ports/distributed-lock.port';

@Injectable()
export class InMemoryLockAdapter implements IDistributedLockPort {
  private locks = new Map<string, { searcherId: string; expiresAt: number }>();

  async acquireSpotLock(spotId: string, searcherId: string, ttlMs = 15000): Promise<boolean> {
    const existing = this.locks.get(spotId);
    const now = Date.now();

    if (existing && existing.expiresAt > now) {
      if (existing.searcherId === searcherId) {
        // Re-entrant / extend
        existing.expiresAt = now + ttlMs;
        return true;
      }
      return false; // locked by someone else
    }

    this.locks.set(spotId, { searcherId, expiresAt: now + ttlMs });
    return true;
  }

  async releaseSpotLock(spotId: string): Promise<void> {
    this.locks.delete(spotId);
  }

  async getLockHolder(spotId: string): Promise<string | null> {
    const existing = this.locks.get(spotId);
    if (!existing) return null;
    if (Date.now() > existing.expiresAt) {
      this.locks.delete(spotId);
      return null;
    }
    return existing.searcherId;
  }

  public clear(): void {
    this.locks.clear();
  }
}
