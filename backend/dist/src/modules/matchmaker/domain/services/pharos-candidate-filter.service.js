"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var PharosCandidateFilterService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PharosCandidateFilterService = void 0;
const common_1 = require("@nestjs/common");
let PharosCandidateFilterService = PharosCandidateFilterService_1 = class PharosCandidateFilterService {
    calculateBearing(from, to) {
        const lat1 = (from.latitude * Math.PI) / 180;
        const lat2 = (to.latitude * Math.PI) / 180;
        const dLon = ((to.longitude - from.longitude) * Math.PI) / 180;
        const y = Math.sin(dLon) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
        const initialBearing = (Math.atan2(y, x) * 180) / Math.PI;
        return (initialBearing + 360) % 360;
    }
    calculateAngularDivergence(headingA, headingB) {
        const diff = Math.abs(headingA - headingB) % 360;
        return diff > 180 ? 360 - diff : diff;
    }
    calculateHaversineDistance(p1, p2) {
        const R = 6371000;
        const phi1 = (p1.latitude * Math.PI) / 180;
        const phi2 = (p2.latitude * Math.PI) / 180;
        const deltaPhi = ((p2.latitude - p1.latitude) * Math.PI) / 180;
        const deltaLambda = ((p2.longitude - p1.longitude) * Math.PI) / 180;
        const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(R * c);
    }
    evaluateCandidate(searcher, spotCoords, currentTime = new Date()) {
        if (searcher.status !== 'ACTIVE_SEARCHING') {
            return { eligible: false, rejectReason: 'INACTIVE_STATUS' };
        }
        if (searcher.hasActiveOfferOrMatch) {
            return { eligible: false, rejectReason: 'SEARCHER_BUSY_WITH_MATCH' };
        }
        const euclideanDistance = this.calculateHaversineDistance(searcher.currentCoords, spotCoords);
        if (euclideanDistance > PharosCandidateFilterService_1.MAX_EUCLIDEAN_RADIUS_METERS) {
            return {
                eligible: false,
                rejectReason: 'BEYOND_MAX_RADIUS',
                euclideanDistanceMeters: euclideanDistance,
            };
        }
        const stalenessSec = (currentTime.getTime() - searcher.lastHeartbeat.getTime()) / 1000;
        if (stalenessSec > PharosCandidateFilterService_1.MAX_PING_STALENESS_SECONDS) {
            return { eligible: false, rejectReason: 'STALE_GPS_HEARTBEAT' };
        }
        if (searcher.gpsAccuracyMeters > PharosCandidateFilterService_1.MAX_GPS_ACCURACY_METERS) {
            return { eligible: false, rejectReason: 'POOR_GPS_ACCURACY' };
        }
        const bearingToSpot = this.calculateBearing(searcher.currentCoords, spotCoords);
        const angularDivergence = this.calculateAngularDivergence(searcher.headingDegrees, bearingToSpot);
        if (searcher.speedKmh > PharosCandidateFilterService_1.SPEED_THRESHOLD_KMH &&
            angularDivergence > PharosCandidateFilterService_1.DIVERGENCE_THRESHOLD_DEG) {
            return {
                eligible: false,
                rejectReason: 'HEADING_DIVERGENCE_AT_SPEED',
                bearingToSpotDeg: Math.round(bearingToSpot * 10) / 10,
                angularDivergenceDeg: Math.round(angularDivergence * 10) / 10,
                euclideanDistanceMeters: euclideanDistance,
            };
        }
        return {
            eligible: true,
            bearingToSpotDeg: Math.round(bearingToSpot * 10) / 10,
            angularDivergenceDeg: Math.round(angularDivergence * 10) / 10,
            euclideanDistanceMeters: euclideanDistance,
        };
    }
};
exports.PharosCandidateFilterService = PharosCandidateFilterService;
PharosCandidateFilterService.MAX_EUCLIDEAN_RADIUS_METERS = 1500;
PharosCandidateFilterService.MAX_PING_STALENESS_SECONDS = 20;
PharosCandidateFilterService.MAX_GPS_ACCURACY_METERS = 40;
PharosCandidateFilterService.SPEED_THRESHOLD_KMH = 25.0;
PharosCandidateFilterService.DIVERGENCE_THRESHOLD_DEG = 120.0;
exports.PharosCandidateFilterService = PharosCandidateFilterService = PharosCandidateFilterService_1 = __decorate([
    (0, common_1.Injectable)()
], PharosCandidateFilterService);
//# sourceMappingURL=pharos-candidate-filter.service.js.map