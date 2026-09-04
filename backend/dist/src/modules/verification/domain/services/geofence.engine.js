"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var GeofenceEngine_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeofenceEngine = void 0;
const common_1 = require("@nestjs/common");
let GeofenceEngine = GeofenceEngine_1 = class GeofenceEngine {
    calculateDistanceMeters(loc1, loc2) {
        const R = 6371000;
        const dLat = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
        const dLon = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((loc1.latitude * Math.PI) / 180) *
                Math.cos((loc2.latitude * Math.PI) / 180) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(R * c * 10) / 10;
    }
    isWithinGeofence(driverLoc, spotLoc) {
        const distance = this.calculateDistanceMeters(driverLoc, spotLoc);
        return distance <= GeofenceEngine_1.MAX_GEOFENCE_RADIUS_METERS;
    }
    evaluateArrivalCondition(telemetry, spotLoc) {
        const distanceMeters = this.calculateDistanceMeters(telemetry.coordinates, spotLoc);
        const isWithinGeofence = distanceMeters <= GeofenceEngine_1.MAX_GEOFENCE_RADIUS_METERS;
        const isStationary = telemetry.speedKmh <= GeofenceEngine_1.MAX_STATIONARY_SPEED_KMH &&
            telemetry.stationaryDurationSeconds >= GeofenceEngine_1.MIN_STATIONARY_DURATION_SECONDS;
        const isArrivalTriggered = isWithinGeofence && isStationary;
        return {
            isWithinGeofence,
            distanceMeters,
            isStationary,
            isArrivalTriggered,
        };
    }
};
exports.GeofenceEngine = GeofenceEngine;
GeofenceEngine.MAX_GEOFENCE_RADIUS_METERS = 30.0;
GeofenceEngine.MAX_STATIONARY_SPEED_KMH = 0.5;
GeofenceEngine.MIN_STATIONARY_DURATION_SECONDS = 15;
exports.GeofenceEngine = GeofenceEngine = GeofenceEngine_1 = __decorate([
    (0, common_1.Injectable)()
], GeofenceEngine);
//# sourceMappingURL=geofence.engine.js.map