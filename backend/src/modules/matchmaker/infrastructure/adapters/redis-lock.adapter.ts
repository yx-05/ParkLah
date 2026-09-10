import { Injectable, Optional } from '@nestjs/common';
import Redis from 'ioredis';
import { IDistributedLockPort } from '../../domain/ports/distributed-lock.port';

@Injectable()
export class RedisDistributedLockAdapter implements IDistributedLockPort {
  private redis: Redis | null = null;

  constructor(@Optional() redisClient?: Redis) {
    if (redisClient) {
      this.redis = redisClient;
    } else if (process.env.REDIS_URL) {
      try {
        const isTls = process.env.REDIS_URL.startsWith('rediss://') || process.env.REDIS_URL.includes('upstash.io');
        this.redis = new Redis(process.env.REDIS_URL, {
          lazyConnect: true,
          tls: isTls ? { rejectUnauthorized: false } : undefined,
        });
      } catch (e) {
        this.redis = null;
      }
    }
  }

  async acquireSpotLock(spotId: string, searcherId: string, ttlMs = 15000): Promise<boolean> {
    if (!this.redis) return true;
    const key = `lock:spot:${spotId}`;
    const result = await this.redis.set(key, searcherId, 'PX', ttlMs, 'NX');
    return result === 'OK';
  }

  async releaseSpotLock(spotId: string): Promise<void> {
    if (!this.redis) return;
    const key = `lock:spot:${spotId}`;
    await this.redis.del(key);
  }

  async getLockHolder(spotId: string): Promise<string | null> {
    if (!this.redis) return null;
    const key = `lock:spot:${spotId}`;
    return this.redis.get(key);
  }
}
