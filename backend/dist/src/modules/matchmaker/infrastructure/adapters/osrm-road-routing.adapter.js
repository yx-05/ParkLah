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
var OsrmRoadRoutingAdapter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OsrmRoadRoutingAdapter = void 0;
const common_1 = require("@nestjs/common");
let OsrmRoadRoutingAdapter = OsrmRoadRoutingAdapter_1 = class OsrmRoadRoutingAdapter {
    constructor(baseUrl, timeoutMs = 4000) {
        this.logger = new common_1.Logger(OsrmRoadRoutingAdapter_1.name);
        this.baseUrl = (baseUrl || process.env.OSRM_BASE_URL || 'https://router.project-osrm.org').replace(/\/$/, '');
        this.timeoutMs = timeoutMs;
    }
    async calculateCandidateRoutes(spotCoords, candidates) {
        if (candidates.length === 0) {
            return [];
        }
        try {
            return await this.queryOsrmTable(spotCoords, candidates);
        }
        catch (error) {
            this.logger.warn(`OSRM table routing failed or timed out (${error.message}). Falling back to urban Haversine estimation.`);
            return this.fallbackHaversineRoutes(spotCoords, candidates);
        }
    }
    async queryOsrmTable(spotCoords, candidates) {
        const coordsList = [
            `${spotCoords.longitude},${spotCoords.latitude}`,
            ...candidates.map((c) => `${c.coords.longitude},${c.coords.latitude}`),
        ].join(';');
        const sourcesIndices = candidates.map((_, i) => i + 1).join(';');
        const url = `${this.baseUrl}/table/v1/driving/${coordsList}?sources=${sourcesIndices}&destinations=0&annotations=duration,distance`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
        const response = await fetch(url, {
            method: 'GET',
            headers: { Accept: 'application/json' },
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
            throw new Error(`OSRM HTTP error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        if (data.code !== 'Ok' || !data.durations || !data.distances) {
            throw new Error(`OSRM response code: ${data.code}`);
        }
        return candidates.map((candidate, idx) => {
            const durationSeconds = data.durations[idx] ? data.durations[idx][0] : null;
            const distanceMeters = data.distances[idx] ? data.distances[idx][0] : null;
            if (durationSeconds === null || distanceMeters === null) {
                return this.singleHaversineEstimate(spotCoords, candidate);
            }
            return {
                searcherId: candidate.searcherId,
                roadDistanceMeters: Math.round(distanceMeters),
                roadEtaSeconds: Math.round(durationSeconds),
                routingSource: 'OSRM',
            };
        });
    }
    fallbackHaversineRoutes(spotCoords, candidates) {
        return candidates.map((candidate) => this.singleHaversineEstimate(spotCoords, candidate));
    }
    singleHaversineEstimate(spotCoords, candidate) {
        const R = 6371000;
        const phi1 = (candidate.coords.latitude * Math.PI) / 180;
        const phi2 = (spotCoords.latitude * Math.PI) / 180;
        const deltaPhi = ((spotCoords.latitude - candidate.coords.latitude) * Math.PI) / 180;
        const deltaLambda = ((spotCoords.longitude - candidate.coords.longitude) * Math.PI) / 180;
        const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const euclidMeters = Math.round(R * c);
        const roadDistanceMeters = Math.round(euclidMeters * 1.35);
        const roadEtaSeconds = Math.max(15, Math.round(roadDistanceMeters / 6.11));
        return {
            searcherId: candidate.searcherId,
            roadDistanceMeters,
            roadEtaSeconds,
            routingSource: 'HAVERSINE_FALLBACK',
        };
    }
};
exports.OsrmRoadRoutingAdapter = OsrmRoadRoutingAdapter;
exports.OsrmRoadRoutingAdapter = OsrmRoadRoutingAdapter = OsrmRoadRoutingAdapter_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [String, Object])
], OsrmRoadRoutingAdapter);
//# sourceMappingURL=osrm-road-routing.adapter.js.map