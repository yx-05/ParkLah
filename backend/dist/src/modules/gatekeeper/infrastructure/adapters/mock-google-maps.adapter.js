"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockGoogleMapsRoutingAdapter = void 0;
const common_1 = require("@nestjs/common");
let MockGoogleMapsRoutingAdapter = class MockGoogleMapsRoutingAdapter {
    constructor() {
        this.mockedDistanceMeters = null;
        this.mockedDurationSeconds = null;
    }
    setMockedMetrics(distanceMeters, durationSeconds) {
        this.mockedDistanceMeters = distanceMeters;
        this.mockedDurationSeconds = durationSeconds;
    }
    resetMocks() {
        this.mockedDistanceMeters = null;
        this.mockedDurationSeconds = null;
    }
    async searchPlace(query, proximity) {
        return [
            {
                placeId: `place_${query.toLowerCase().replace(/\s+/g, '_')}`,
                name: query,
                address: `${query}, Kuala Lumpur, Malaysia`,
                latitude: proximity ? proximity.latitude + 0.005 : 3.139,
                longitude: proximity ? proximity.longitude + 0.005 : 101.6869,
            },
        ];
    }
    async getDistanceAndEta(origin, destination) {
        if (this.mockedDistanceMeters !== null && this.mockedDurationSeconds !== null) {
            return {
                distanceMeters: this.mockedDistanceMeters,
                durationSeconds: this.mockedDurationSeconds,
                polyline: 'mock_encoded_polyline_points',
            };
        }
        const distanceMeters = Math.round(this.haversineDistance(origin.latitude, origin.longitude, destination.latitude, destination.longitude));
        const durationSeconds = Math.round(distanceMeters / 8.33);
        return {
            distanceMeters,
            durationSeconds,
            polyline: 'mock_encoded_polyline_points',
        };
    }
    async getPolyline(origin, destination) {
        return 'mock_encoded_polyline_points';
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
};
exports.MockGoogleMapsRoutingAdapter = MockGoogleMapsRoutingAdapter;
exports.MockGoogleMapsRoutingAdapter = MockGoogleMapsRoutingAdapter = __decorate([
    (0, common_1.Injectable)()
], MockGoogleMapsRoutingAdapter);
//# sourceMappingURL=mock-google-maps.adapter.js.map