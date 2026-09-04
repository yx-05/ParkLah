"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryLeaverSpatialRepository = void 0;
const common_1 = require("@nestjs/common");
let InMemoryLeaverSpatialRepository = class InMemoryLeaverSpatialRepository {
    constructor() {
        this.leavers = new Map();
    }
    async registerActiveLeaver(session) {
        this.leavers.set(session.leaverId, session);
        return session;
    }
    async updateCountdown(leaverId, remainingSeconds) {
        const session = this.leavers.get(leaverId);
        if (session) {
            session.remainingSeconds = remainingSeconds;
        }
    }
    async markMatched(leaverId, searcherId) {
        const session = this.leavers.get(leaverId);
        if (session) {
            session.isMatched = true;
            session.matchedSearcherId = searcherId;
        }
    }
    async removeActiveLeaver(leaverId) {
        return this.leavers.delete(leaverId);
    }
    async getLeaverSession(leaverId) {
        const session = this.leavers.get(leaverId);
        if (!session)
            return null;
        if (Date.now() > session.expiresAt.getTime()) {
            this.leavers.delete(leaverId);
            return null;
        }
        return session;
    }
    async findNearbyActiveLeavers(latitude, longitude, radiusMeters = 1000) {
        const results = [];
        for (const session of this.leavers.values()) {
            if (session.isMatched || Date.now() > session.expiresAt.getTime()) {
                continue;
            }
            const dist = this.haversineDistance(latitude, longitude, session.coordinates.latitude, session.coordinates.longitude);
            if (dist <= radiusMeters) {
                results.push({ session, distanceMeters: Math.round(dist) });
            }
        }
        return results.sort((a, b) => a.distanceMeters - b.distanceMeters);
    }
    haversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371000;
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    clear() {
        this.leavers.clear();
    }
};
exports.InMemoryLeaverSpatialRepository = InMemoryLeaverSpatialRepository;
exports.InMemoryLeaverSpatialRepository = InMemoryLeaverSpatialRepository = __decorate([
    (0, common_1.Injectable)()
], InMemoryLeaverSpatialRepository);
//# sourceMappingURL=in-memory-leaver-spatial.repository.js.map