import { Injectable, Optional } from '@nestjs/common';
import Redis from 'ioredis';
import { IOtpCachePort } from '../../domain/ports/otp-cache.port';

@Injectable()
export class RedisOtpCacheAdapter implements IOtpCachePort {
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

  async storeOtp(phoneNumber: string, otp: string, ttlSeconds: number): Promise<void> {
    if (!this.redis) return;
    await this.redis.set(`otp:${phoneNumber}`, otp, 'EX', ttlSeconds);
  }

  async getOtp(phoneNumber: string): Promise<string | null> {
    if (!this.redis) return null;
    return this.redis.get(`otp:${phoneNumber}`);
  }

  async deleteOtp(phoneNumber: string): Promise<void> {
    if (!this.redis) return;
    await this.redis.del(`otp:${phoneNumber}`);
  }

  async checkRateLimit(phoneNumber: string, rateLimitSeconds: number): Promise<boolean> {
    if (!this.redis) return true;
    const key = `ratelimit:otp:${phoneNumber}`;
    const acquired = await this.redis.set(key, '1', 'EX', rateLimitSeconds, 'NX');
    return acquired === 'OK';
  }

  async storeSession(userId: string, sessionData: any, ttlSeconds: number): Promise<void> {
    if (!this.redis) return;
    await this.redis.set(`session:token:${userId}`, JSON.stringify(sessionData), 'EX', ttlSeconds);
  }

  async getSession(userId: string): Promise<any | null> {
    if (!this.redis) return null;
    const data = await this.redis.get(`session:token:${userId}`);
    return data ? JSON.parse(data) : null;
  }

  async deleteSession(userId: string): Promise<void> {
    if (!this.redis) return;
    await this.redis.del(`session:token:${userId}`);
  }
}
