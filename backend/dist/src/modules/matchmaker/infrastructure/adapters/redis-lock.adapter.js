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
exports.RedisDistributedLockAdapter = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = require("ioredis");
let RedisDistributedLockAdapter = class RedisDistributedLockAdapter {
    constructor(redisClient) {
        this.redis = null;
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
    async acquireSpotLock(spotId, searcherId, ttlMs = 15000) {
        if (!this.redis)
            return true;
        const key = `lock:spot:${spotId}`;
        const result = await this.redis.set(key, searcherId, 'PX', ttlMs, 'NX');
        return result === 'OK';
    }
    async releaseSpotLock(spotId) {
        if (!this.redis)
            return;
        const key = `lock:spot:${spotId}`;
        await this.redis.del(key);
    }
    async getLockHolder(spotId) {
        if (!this.redis)
            return null;
        const key = `lock:spot:${spotId}`;
        return this.redis.get(key);
    }
};
exports.RedisDistributedLockAdapter = RedisDistributedLockAdapter;
exports.RedisDistributedLockAdapter = RedisDistributedLockAdapter = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [ioredis_1.default])
], RedisDistributedLockAdapter);
//# sourceMappingURL=redis-lock.adapter.js.map