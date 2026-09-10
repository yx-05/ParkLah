"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisSearcherSpatialRepository = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = require("ioredis");
let RedisSearcherSpatialRepository = class RedisSearcherSpatialRepository {
    constructor(redisClient) {
        this.redis = null;
        this.GEO_KEY = 'geo:searchers:active';
        this.STATE_PREFIX = 'searcher:state:';
        if (redisClient) {
            this.redis = redisClient;
        }
        else if (process.env.REDIS_URL) {
            try {
                const isTls = process.env.REDIS_URL.startsWith('rediss://') || process.env.REDIS_URL.includes('upstash.io');
                this.redis = new ioredis_1.default(process.env.REDIS_URL, {
                    lazyConnect: true,
                    tls: isTls ? { rejectUnauthorized: false } : undefined,
                });
            }
            catch (e) {
                this.redis = null;
            }
        }
    }
    async registerActiveSearcher(searcherId, currentCoords, destCoords, destName, radiusMeters = 1000) {
        const session = {
            searcherId,
            currentCoords,
            destCoords,
            destName,
            radiusMeters,
            registeredAt: new Date(),
            lastHeartbeat: new Date(),
        };
        if (this.redis) {
            await this.redis.geoadd(this.GEO_KEY, currentCoords.longitude, currentCoords.latitude, searcherId);
            await this.redis.set(`${this.STATE_PREFIX}${searcherId}`, JSON.stringify(session), 'EX', 300);
        }
        return session;
    }
    async updateSearcherLocation(searcherId, coords) {
        if (!this.redis)
            return;
        await this.redis.geoadd(this.GEO_KEY, coords.longitude, coords.latitude, searcherId);
        const existing = await this.getActiveSearcherState(searcherId);
        if (existing) {
            existing.currentCoords = coords;
            existing.lastHeartbeat = new Date();
            await this.redis.set(`${this.STATE_PREFIX}${searcherId}`, JSON.stringify(existing), 'EX', 300);
        }
    }
    async removeActiveSearcher(searcherId) {
        if (!this.redis)
            return true;
        await this.redis.zrem(this.GEO_KEY, searcherId);
        await this.redis.del(`${this.STATE_PREFIX}${searcherId}`);
        return true;
    }
    async getActiveSearcherState(searcherId) {
        if (!this.redis)
            return null;
        const data = await this.redis.get(`${this.STATE_PREFIX}${searcherId}`);
        if (!data)
            return null;
        const parsed = JSON.parse(data);
        return {
            ...parsed,
            registeredAt: new Date(parsed.registeredAt),
            lastHeartbeat: new Date(parsed.lastHeartbeat),
        };
    }
    async findNearbyActiveSearchers(spotCoords, radiusMeters = 1000) {
        if (!this.redis)
            return [];
        let membersWithDist = [];
        try {
            const rawResults = (await this.redis.geosearch(this.GEO_KEY, 'FROMLONLAT', spotCoords.longitude, spotCoords.latitude, 'BYRADIUS', radiusMeters, 'm', 'WITHDIST', 'ASC'));
            membersWithDist = rawResults || [];
        }
        catch {
            const rawResults = (await this.redis.georadius(this.GEO_KEY, spotCoords.longitude, spotCoords.latitude, radiusMeters, 'm', 'WITHDIST', 'ASC'));
            membersWithDist = rawResults || [];
        }
        const results = [];
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
};
exports.RedisSearcherSpatialRepository = RedisSearcherSpatialRepository;
exports.RedisSearcherSpatialRepository = RedisSearcherSpatialRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [ioredis_1.default])
], RedisSearcherSpatialRepository);
//# sourceMappingURL=redis-searcher-spatial.repository.js.map