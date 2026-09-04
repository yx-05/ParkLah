"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemorySearcherSpatialRepository = void 0;
const common_1 = require("@nestjs/common");
let InMemorySearcherSpatialRepository = class InMemorySearcherSpatialRepository {
    constructor() {
        this.activeSearchers = new Map();
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
        this.activeSearchers.set(searcherId, session);
        return session;
    }
    async updateSearcherLocation(searcherId, coords) {
        const session = this.activeSearchers.get(searcherId);
        if (session) {
            session.currentCoords = coords;
            session.lastHeartbeat = new Date();
        }
    }
    async removeActiveSearcher(searcherId) {
        return this.activeSearchers.delete(searcherId);
    }
    async getActiveSearcherState(searcherId) {
        return this.activeSearchers.get(searcherId) || null;
    }
    async findNearbyActiveSearchers(spotCoords, radiusMeters = 1000) {
        const results = [];
        for (const searcher of this.activeSearchers.values()) {
            const distToSpot = this.haversineDistance(searcher.currentCoords.latitude, searcher.currentCoords.longitude, spotCoords.latitude, spotCoords.longitude);
            if (distToSpot <= radiusMeters) {
                results.push({ searcher, distanceMeters: Math.round(distToSpot) });
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
        this.activeSearchers.clear();
    }
};
exports.InMemorySearcherSpatialRepository = InMemorySearcherSpatialRepository;
exports.InMemorySearcherSpatialRepository = InMemorySearcherSpatialRepository = __decorate([
    (0, common_1.Injectable)()
], InMemorySearcherSpatialRepository);
//# sourceMappingURL=in-memory-searcher-spatial.repository.js.map