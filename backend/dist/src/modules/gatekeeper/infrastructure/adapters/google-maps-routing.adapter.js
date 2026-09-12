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
        const cleanQuery = query && query.trim().length > 0 ? query.trim() : 'Parking';
        if (this.apiKey) {
            try {
                let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(cleanQuery)}&key=${this.apiKey}`;
                if (proximity) {
                    url += `&location=${proximity.latitude},${proximity.longitude}&radius=50000`;
                }
                const res = await fetch(url);
                const data = await res.json();
                if (data.status === 'OK' && Array.isArray(data.results) && data.results.length > 0) {
                    return data.results.map((p) => ({
                        placeId: p.place_id,
                        name: p.name || cleanQuery,
                        address: p.formatted_address || p.name || 'Selected Place',
                        latitude: p.geometry?.location?.lat ?? (proximity ? proximity.latitude : 3.1176),
                        longitude: p.geometry?.location?.lng ?? (proximity ? proximity.longitude : 101.6778),
                    }));
                }
            }
            catch (error) {
                this.logger.error('Google Places Text Search failed, attempting Photon fallback:', error);
            }
        }
        try {
            let photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(cleanQuery)}&limit=10`;
            if (proximity) {
                photonUrl += `&lat=${proximity.latitude}&lon=${proximity.longitude}`;
            }
            const pRes = await fetch(photonUrl, {
                headers: { 'User-Agent': 'ParkLah/1.0' },
                signal: AbortSignal.timeout(4000),
            });
            if (pRes.ok) {
                const pData = await pRes.json();
                if (Array.isArray(pData.features) && pData.features.length > 0) {
                    return pData.features.map((f, idx) => {
                        const props = f.properties || {};
                        const coords = f.geometry?.coordinates || [101.6778, 3.1176];
                        const baseName = props.name || props.street || cleanQuery;
                        const area = props.district || props.city || props.street;
                        const name = area && !baseName.toLowerCase().includes(area.toLowerCase())
                            ? `${baseName} - ${area}`
                            : baseName;
                        const addressParts = [
                            props.street,
                            props.district,
                            props.city,
                            props.state,
                            props.country,
                        ].filter(Boolean);
                        const address = addressParts.length > 0 ? addressParts.join(', ') : baseName;
                        return {
                            placeId: props.osm_id ? `osm_${props.osm_id}` : `place_photon_${idx}`,
                            name,
                            address,
                            latitude: coords[1],
                            longitude: coords[0],
                        };
                    });
                }
            }
        }
        catch (photonError) {
            this.logger.warn('Photon geocoding fallback unreachable, falling back to mock locations:', photonError);
        }
        return this.fallbackAdapter.searchPlace(cleanQuery, proximity);
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