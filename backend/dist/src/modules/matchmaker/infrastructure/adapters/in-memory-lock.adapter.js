"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryLockAdapter = void 0;
const common_1 = require("@nestjs/common");
let InMemoryLockAdapter = class InMemoryLockAdapter {
    constructor() {
        this.locks = new Map();
    }
    async acquireSpotLock(spotId, searcherId, ttlMs = 15000) {
        const existing = this.locks.get(spotId);
        const now = Date.now();
        if (existing && existing.expiresAt > now) {
            if (existing.searcherId === searcherId) {
                existing.expiresAt = now + ttlMs;
                return true;
            }
            return false;
        }
        this.locks.set(spotId, { searcherId, expiresAt: now + ttlMs });
        return true;
    }
    async releaseSpotLock(spotId) {
        this.locks.delete(spotId);
    }
    async getLockHolder(spotId) {
        const existing = this.locks.get(spotId);
        if (!existing)
            return null;
        if (Date.now() > existing.expiresAt) {
            this.locks.delete(spotId);
            return null;
        }
        return existing.searcherId;
    }
    clear() {
        this.locks.clear();
    }
};
exports.InMemoryLockAdapter = InMemoryLockAdapter;
exports.InMemoryLockAdapter = InMemoryLockAdapter = __decorate([
    (0, common_1.Injectable)()
], InMemoryLockAdapter);
//# sourceMappingURL=in-memory-lock.adapter.js.map