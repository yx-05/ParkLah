"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryProbabilisticSpotRepository = void 0;
const common_1 = require("@nestjs/common");
const spot_status_enum_1 = require("../../domain/enums/spot-status.enum");
let InMemoryProbabilisticSpotRepository = class InMemoryProbabilisticSpotRepository {
    constructor() {
        this.spots = new Map();
    }
    async create(spot) {
        this.spots.set(spot.id, spot);
        return spot;
    }
    async findById(id) {
        return this.spots.get(id) || null;
    }
    async findAllAvailable() {
        return Array.from(this.spots.values()).filter((s) => s.status === spot_status_enum_1.SpotStatus.AVAILABLE);
    }
    async findActiveWithinRadius(latitude, longitude, radiusMeters = 500, limit = 3) {
        const results = [];
        for (const spot of this.spots.values()) {
            if (spot.status !== spot_status_enum_1.SpotStatus.AVAILABLE || spot.currentP < 0.150) {
                continue;
            }
            const distance = this.haversineDistanceMeters(latitude, longitude, spot.latitude, spot.longitude);
            if (distance <= radiusMeters) {
                results.push({ spot, distanceMeters: Math.round(distance) });
            }
        }
        results.sort((a, b) => {
            if (b.spot.currentP !== a.spot.currentP) {
                return b.spot.currentP - a.spot.currentP;
            }
            return a.distanceMeters - b.distanceMeters;
        });
        return results.slice(0, limit);
    }
    async update(spot) {
        this.spots.set(spot.id, spot);
        return spot;
    }
    async updateBatchProbabilities(updates) {
        for (const u of updates) {
            const spot = this.spots.get(u.id);
            if (spot) {
                spot.applyDecay(u.currentP);
                if (u.status) {
                    spot.status = u.status;
                }
            }
        }
    }
    async expireSpotsBatch(cutoffTime) {
        let count = 0;
        for (const spot of this.spots.values()) {
            if (spot.status === spot_status_enum_1.SpotStatus.AVAILABLE &&
                (spot.expiresAt.getTime() < cutoffTime.getTime() || spot.currentP < 0.150)) {
                spot.applyDecay(0.0);
                spot.status = spot_status_enum_1.SpotStatus.EXPIRED;
                count++;
            }
        }
        return count;
    }
    haversineDistanceMeters(lat1, lon1, lat2, lon2) {
        const R = 6371000;
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    deg2rad(deg) {
        return deg * (Math.PI / 180);
    }
    clear() {
        this.spots.clear();
    }
};
exports.InMemoryProbabilisticSpotRepository = InMemoryProbabilisticSpotRepository;
exports.InMemoryProbabilisticSpotRepository = InMemoryProbabilisticSpotRepository = __decorate([
    (0, common_1.Injectable)()
], InMemoryProbabilisticSpotRepository);
//# sourceMappingURL=in-memory-probabilistic-spot.repository.js.map