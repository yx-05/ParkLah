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
var GoogleMapsRoutingAdapter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleMapsRoutingAdapter = void 0;
const common_1 = require("@nestjs/common");
const mock_google_maps_adapter_1 = require("./mock-google-maps.adapter");
let GoogleMapsRoutingAdapter = GoogleMapsRoutingAdapter_1 = class GoogleMapsRoutingAdapter {
    constructor() {
        this.logger = new common_1.Logger(GoogleMapsRoutingAdapter_1.name);
        this.fallbackAdapter = new mock_google_maps_adapter_1.MockGoogleMapsRoutingAdapter();
        this.apiKey = null;
        const key = process.env.GOOGLE_MAPS_API_KEY;
        if (key && key !== 'AIzaSyExampleGoogleMapsKeyHere' && key.trim().length > 0) {
            this.apiKey = key.trim();
            this.logger.log('Google Maps API key detected. Using live Google Maps Platform services.');
        }
        else {
            this.logger.warn('No valid GOOGLE_MAPS_API_KEY found. Falling back to simulated Haversine routing.');
        }
    }
    async searchPlace(query, proximity) {
        if (!this.apiKey) {
            return this.fallbackAdapter.searchPlace(query, proximity);
        }
        try {
            let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&components=country:my&key=${this.apiKey}`;
            if (proximity) {
                url += `&location=${proximity.latitude},${proximity.longitude}&radius=50000`;
            }
            const res = await fetch(url);
            const data = await res.json();
            if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
                this.logger.warn(`Google Places API returned status: ${data.status}`);
                return this.fallbackAdapter.searchPlace(query, proximity);
            }
            return (data.predictions || []).map((p) => ({
                placeId: p.place_id,
                name: p.structured_formatting?.main_text || p.description,
                address: p.description,
                latitude: proximity ? proximity.latitude : 3.139,
                longitude: proximity ? proximity.longitude : 101.6869,
            }));
        }
        catch (error) {
            this.logger.error('Google Places Autocomplete failed, falling back to mock:', error);
            return this.fallbackAdapter.searchPlace(query, proximity);
        }
    }
    async getDistanceAndEta(origin, destination) {
        if (!this.apiKey) {
            return this.fallbackAdapter.getDistanceAndEta(origin, destination);
        }
        try {
            const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin.latitude},${origin.longitude}&destinations=${destination.latitude},${destination.longitude}&mode=driving&departure_time=now&key=${this.apiKey}`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.status === 'OK' &&
                data.rows?.[0]?.elements?.[0]?.status === 'OK') {
                const element = data.rows[0].elements[0];
                const distanceMeters = element.distance.value;
                const durationSeconds = element.duration_in_traffic
                    ? element.duration_in_traffic.value
                    : element.duration.value;
                return {
                    distanceMeters,
                    durationSeconds,
                    polyline: '',
                };
            }
            return this.fallbackAdapter.getDistanceAndEta(origin, destination);
        }
        catch (error) {
            this.logger.error('Google Distance Matrix failed, falling back to mock:', error);
            return this.fallbackAdapter.getDistanceAndEta(origin, destination);
        }
    }
    async getPolyline(origin, destination) {
        if (!this.apiKey) {
            return this.fallbackAdapter.getPolyline(origin, destination);
        }
        try {
            const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&mode=driving&key=${this.apiKey}`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.status === 'OK' && data.routes?.[0]?.overview_polyline?.points) {
                return data.routes[0].overview_polyline.points;
            }
            return this.fallbackAdapter.getPolyline(origin, destination);
        }
        catch (error) {
            this.logger.error('Google Directions API failed, falling back to mock:', error);
            return this.fallbackAdapter.getPolyline(origin, destination);
        }
    }
};
exports.GoogleMapsRoutingAdapter = GoogleMapsRoutingAdapter;
exports.GoogleMapsRoutingAdapter = GoogleMapsRoutingAdapter = GoogleMapsRoutingAdapter_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], GoogleMapsRoutingAdapter);
//# sourceMappingURL=google-maps-routing.adapter.js.map