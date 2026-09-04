"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryOtpCacheAdapter = void 0;
const common_1 = require("@nestjs/common");
let InMemoryOtpCacheAdapter = class InMemoryOtpCacheAdapter {
    constructor() {
        this.otps = new Map();
        this.rateLimits = new Map();
        this.sessions = new Map();
    }
    async storeOtp(phoneNumber, otp, ttlSeconds) {
        this.otps.set(phoneNumber, {
            otp,
            expiresAt: Date.now() + ttlSeconds * 1000,
        });
    }
    async getOtp(phoneNumber) {
        const entry = this.otps.get(phoneNumber);
        if (!entry)
            return null;
        if (Date.now() > entry.expiresAt) {
            this.otps.delete(phoneNumber);
            return null;
        }
        return entry.otp;
    }
    async deleteOtp(phoneNumber) {
        this.otps.delete(phoneNumber);
    }
    async checkRateLimit(phoneNumber, rateLimitSeconds) {
        const nextAllowed = this.rateLimits.get(phoneNumber);
        const now = Date.now();
        if (nextAllowed && now < nextAllowed) {
            return false;
        }
        this.rateLimits.set(phoneNumber, now + rateLimitSeconds * 1000);
        return true;
    }
    async storeSession(userId, sessionData, ttlSeconds) {
        this.sessions.set(userId, {
            data: sessionData,
            expiresAt: Date.now() + ttlSeconds * 1000,
        });
    }
    async getSession(userId) {
        const entry = this.sessions.get(userId);
        if (!entry)
            return null;
        if (Date.now() > entry.expiresAt) {
            this.sessions.delete(userId);
            return null;
        }
        return entry.data;
    }
    async deleteSession(userId) {
        this.sessions.delete(userId);
    }
    clear() {
        this.otps.clear();
        this.rateLimits.clear();
        this.sessions.clear();
    }
};
exports.InMemoryOtpCacheAdapter = InMemoryOtpCacheAdapter;
exports.InMemoryOtpCacheAdapter = InMemoryOtpCacheAdapter = __decorate([
    (0, common_1.Injectable)()
], InMemoryOtpCacheAdapter);
//# sourceMappingURL=in-memory-otp-cache.adapter.js.map