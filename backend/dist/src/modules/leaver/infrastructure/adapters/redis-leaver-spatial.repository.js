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
exports.RedisLeaverSpatialRepository = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = require("ioredis");
let RedisLeaverSpatialRepository = class RedisLeaverSpatialRepository {
    constructor(redisClient) {
        this.redis = null;
        this.GEO_KEY = 'geo:leavers:active';
        this.STATE_PREFIX = 'leaver:state:';
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
    async registerActiveLeaver(session) {
        if (this.redis) {
            await this.redis.geoadd(this.GEO_KEY, session.coordinates.longitude, session.coordinates.latitude, session.leaverId);
            await this.redis.set(`${this.STATE_PREFIX}${session.leaverId}`, JSON.stringify(session), 'EX', session.countdownSeconds + 60);
        }
        return session;
    }
    async updateCountdown(leaverId, remainingSeconds) {
        const session = await this.getLeaverSession(leaverId);
        if (session && this.redis) {
            session.remainingSeconds = remainingSeconds;
            await this.redis.set(`${this.STATE_PREFIX}${leaverId}`, JSON.stringify(session), 'EX', Math.max(remainingSeconds, 30));
        }
    }
    async markMatched(leaverId, searcherId) {
        const session = await this.getLeaverSession(leaverId);
        if (session && this.redis) {
            session.isMatched = true;
            session.matchedSearcherId = searcherId;
            await this.redis.set(`${this.STATE_PREFIX}${leaverId}`, JSON.stringify(session), 'EX', session.remainingSeconds + 60);
        }
    }
    async removeActiveLeaver(leaverId) {
        if (!this.redis)
            return true;
        await this.redis.zrem(this.GEO_KEY, leaverId);
        await this.redis.del(`${this.STATE_PREFIX}${leaverId}`);
        return true;
    }
    async getLeaverSession(leaverId) {
        if (!this.redis)
            return null;
        const data = await this.redis.get(`${this.STATE_PREFIX}${leaverId}`);
        if (!data)
            return null;
        const parsed = JSON.parse(data);
        const session = {
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
    async findNearbyActiveLeavers(latitude, longitude, radiusMeters = 1000) {
        if (!this.redis)
            return [];
        let membersWithDist = [];
        try {
            const rawResults = (await this.redis.geosearch(this.GEO_KEY, 'FROMLONLAT', longitude, latitude, 'BYRADIUS', radiusMeters, 'm', 'WITHDIST', 'ASC'));
            membersWithDist = rawResults || [];
        }
        catch {
            const rawResults = (await this.redis.georadius(this.GEO_KEY, longitude, latitude, radiusMeters, 'm', 'WITHDIST', 'ASC'));
            membersWithDist = rawResults || [];
        }
        const results = [];
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
};
exports.RedisLeaverSpatialRepository = RedisLeaverSpatialRepository;
exports.RedisLeaverSpatialRepository = RedisLeaverSpatialRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [ioredis_1.default])
], RedisLeaverSpatialRepository);
//# sourceMappingURL=redis-leaver-spatial.repository.js.map