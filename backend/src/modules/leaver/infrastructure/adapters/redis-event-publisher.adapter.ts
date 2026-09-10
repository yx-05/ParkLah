import { Injectable, Optional } from '@nestjs/common';
import Redis from 'ioredis';
import { IEventPublisherPort } from '../../domain/ports/event-publisher.port';

@Injectable()
export class RedisEventPublisherAdapter implements IEventPublisherPort {
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

  async publish(channel: string, event: any): Promise<void> {
    if (!this.redis) return;
    const payload = typeof event === 'string' ? event : JSON.stringify(event);
    await this.redis.publish(channel, payload);
  }
}
