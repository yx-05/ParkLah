import { Injectable, Optional } from '@nestjs/common';
import Redis from 'ioredis';
import {
  ISearcherSpatialRepositoryPort,
  ActiveSearcherSession,
} from '../../domain/ports/searcher-spatial-repository.port';
import { LatLng } from '../../domain/ports/google-maps-routing.port';

@Injectable()
export class RedisSearcherSpatialRepository implements ISearcherSpatialRepositoryPort {
  private redis: Redis | null = null;
  private readonly GEO_KEY = 'geo:searchers:active';
  private readonly STATE_PREFIX = 'searcher:state:';

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

  async registerActiveSearcher(
    searcherId: string,
    currentCoords: LatLng,
    destCoords: LatLng,
    destName: string,
    radiusMeters = 1000,
  ): Promise<ActiveSearcherSession> {
    const session: ActiveSearcherSession = {
      searcherId,
      currentCoords,
      destCoords,
      destName,
      radiusMeters,
      registeredAt: new Date(),
      lastHeartbeat: new Date(),
    };

    if (this.redis) {
      // 1. Add to Geospatial index
      await this.redis.geoadd(this.GEO_KEY, currentCoords.longitude, currentCoords.latitude, searcherId);
      // 2. Save full state with 300s (5m) TTL
      await this.redis.set(
        `${this.STATE_PREFIX}${searcherId}`,
        JSON.stringify(session),
        'EX',
        300,
      );
    }

    return session;
  }

  async updateSearcherLocation(searcherId: string, coords: LatLng): Promise<void> {
    if (!this.redis) return;
    await this.redis.geoadd(this.GEO_KEY, coords.longitude, coords.latitude, searcherId);
    const existing = await this.getActiveSearcherState(searcherId);
    if (existing) {
      existing.currentCoords = coords;
      existing.lastHeartbeat = new Date();
      await this.redis.set(
        `${this.STATE_PREFIX}${searcherId}`,
        JSON.stringify(existing),
        'EX',
        300,
      );
    }
  }

  async removeActiveSearcher(searcherId: string): Promise<boolean> {
    if (!this.redis) return true;
    await this.redis.zrem(this.GEO_KEY, searcherId);
    await this.redis.del(`${this.STATE_PREFIX}${searcherId}`);
    return true;
  }

  async getActiveSearcherState(searcherId: string): Promise<ActiveSearcherSession | null> {
    if (!this.redis) return null;
    const data = await this.redis.get(`${this.STATE_PREFIX}${searcherId}`);
    if (!data) return null;
    const parsed = JSON.parse(data);
    return {
      ...parsed,
      registeredAt: new Date(parsed.registeredAt),
      lastHeartbeat: new Date(parsed.lastHeartbeat),
    };
  }

  async findNearbyActiveSearchers(
    spotCoords: LatLng,
    radiusMeters = 1000,
  ): Promise<Array<{ searcher: ActiveSearcherSession; distanceMeters: number }>> {
    if (!this.redis) return [];

    let membersWithDist: Array<[string, string]> = [];
    try {
      // GEOSEARCH geo:searchers:active FROMLONLAT lng lat BYRADIUS r m WITHDIST ASC
      const rawResults = (await (this.redis as any).geosearch(
        this.GEO_KEY,
        'FROMLONLAT',
        spotCoords.longitude,
        spotCoords.latitude,
        'BYRADIUS',
        radiusMeters,
        'm',
        'WITHDIST',
        'ASC',
      )) as Array<[string, string]>;
      membersWithDist = rawResults || [];
    } catch {
      // Fallback for older Redis versions
      const rawResults = (await (this.redis as any).georadius(
        this.GEO_KEY,
        spotCoords.longitude,
        spotCoords.latitude,
        radiusMeters,
        'm',
        'WITHDIST',
        'ASC',
      )) as Array<[string, string]>;
      membersWithDist = rawResults || [];
    }

    const results: Array<{ searcher: ActiveSearcherSession; distanceMeters: number }> = [];
    for (const [searcherId, distStr] of membersWithDist) {
      const state = await this.getActiveSearcherState(searcherId);
      if (state) {
        results.push({
          searcher: state,
          distanceMeters: Math.round(parseFloat(distStr)),
        });
      }
    }

    return results;
  }
}
