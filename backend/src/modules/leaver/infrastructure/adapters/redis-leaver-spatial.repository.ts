import { Injectable, Optional } from '@nestjs/common';
import Redis from 'ioredis';
import { ILeaverSpatialRepositoryPort } from '../../domain/ports/leaver-spatial-repository.port';
import { LeaverSessionData } from '../../application/dto';

@Injectable()
export class RedisLeaverSpatialRepository implements ILeaverSpatialRepositoryPort {
  private redis: Redis | null = null;
  private readonly GEO_KEY = 'geo:leavers:active';
  private readonly STATE_PREFIX = 'leaver:state:';

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

  async registerActiveLeaver(session: LeaverSessionData): Promise<LeaverSessionData> {
    if (this.redis) {
      await this.redis.geoadd(
        this.GEO_KEY,
        session.coordinates.longitude,
        session.coordinates.latitude,
        session.leaverId,
      );
      await this.redis.set(
        `${this.STATE_PREFIX}${session.leaverId}`,
        JSON.stringify(session),
        'EX',
        session.countdownSeconds === 0 ? 120 : session.countdownSeconds + 60,
      );
    }
    return session;
  }

  async updateCountdown(leaverId: string, remainingSeconds: number): Promise<void> {
    const session = await this.getLeaverSession(leaverId);
    if (session && this.redis) {
      session.remainingSeconds = remainingSeconds;
      await this.redis.set(
        `${this.STATE_PREFIX}${leaverId}`,
        JSON.stringify(session),
        'EX',
        Math.max(remainingSeconds, 30),
      );
    }
  }

  async markMatched(leaverId: string, searcherId: string): Promise<void> {
    const session = await this.getLeaverSession(leaverId);
    if (session && this.redis) {
      session.isMatched = true;
      session.matchedSearcherId = searcherId;
      await this.redis.set(
        `${this.STATE_PREFIX}${leaverId}`,
        JSON.stringify(session),
        'EX',
        session.remainingSeconds + 60,
      );
    }
  }

  async removeActiveLeaver(leaverId: string): Promise<boolean> {
    if (!this.redis) return true;
    await this.redis.zrem(this.GEO_KEY, leaverId);
    await this.redis.del(`${this.STATE_PREFIX}${leaverId}`);
    return true;
  }

  async getLeaverSession(leaverId: string): Promise<LeaverSessionData | null> {
    if (!this.redis) return null;
    const data = await this.redis.get(`${this.STATE_PREFIX}${leaverId}`);
    if (!data) return null;
    const parsed = JSON.parse(data);
    const session: LeaverSessionData = {
      ...parsed,
      broadcastedAt: new Date(parsed.broadcastedAt),
      expiresAt: new Date(parsed.expiresAt),
    };
    if (Date.now() > session.expiresAt.getTime()) {
      await this.removeActiveLeaver(leaverId);
      return null;
    }
    return session;
  }

  async findNearbyActiveLeavers(
    latitude: number,
    longitude: number,
    radiusMeters = 1000,
  ): Promise<Array<{ session: LeaverSessionData; distanceMeters: number }>> {
    if (!this.redis) return [];

    let membersWithDist: Array<[string, string]> = [];
    try {
      const rawResults = (await (this.redis as any).geosearch(
        this.GEO_KEY,
        'FROMLONLAT',
        longitude,
        latitude,
        'BYRADIUS',
        radiusMeters,
        'm',
        'WITHDIST',
        'ASC',
      )) as Array<[string, string]>;
      membersWithDist = rawResults || [];
    } catch {
      const rawResults = (await (this.redis as any).georadius(
        this.GEO_KEY,
        longitude,
        latitude,
        radiusMeters,
        'm',
        'WITHDIST',
        'ASC',
      )) as Array<[string, string]>;
      membersWithDist = rawResults || [];
    }

    const results: Array<{ session: LeaverSessionData; distanceMeters: number }> = [];
    for (const [leaverId, distStr] of membersWithDist) {
      const session = await this.getLeaverSession(leaverId);
      if (session && !session.isMatched) {
        results.push({
          session,
          distanceMeters: Math.round(parseFloat(distStr)),
        });
      }
    }

    return results;
  }
}
