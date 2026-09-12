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
var DemandForecastService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DemandForecastService = void 0;
const common_1 = require("@nestjs/common");
const fs = require("fs");
const path = require("path");
const DEFAULT_HUBS = [
    {
        hub_index: 0,
        name: 'Mid Valley Megamall',
        archetype: 'RETAIL_MALL',
        latitude: 3.1176,
        longitude: 101.6778,
        capacity: 4500,
        base_occupancy: 0.65,
        traffic_multiplier: 1.35,
    },
    {
        hub_index: 1,
        name: 'Bangsar Telawi',
        archetype: 'NIGHTLIFE_ENTERTAINMENT',
        latitude: 3.1303,
        longitude: 101.671,
        capacity: 1200,
        base_occupancy: 0.55,
        traffic_multiplier: 1.4,
    },
    {
        hub_index: 2,
        name: 'SS15 Subang Jaya',
        archetype: 'CAMPUS_COMMUTER',
        latitude: 3.0765,
        longitude: 101.59,
        capacity: 1800,
        base_occupancy: 0.58,
        traffic_multiplier: 1.42,
    },
    {
        hub_index: 3,
        name: 'Bukit Bintang',
        archetype: 'NIGHTLIFE_ENTERTAINMENT',
        latitude: 3.1466,
        longitude: 101.7112,
        capacity: 3500,
        base_occupancy: 0.68,
        traffic_multiplier: 1.38,
    },
    {
        hub_index: 4,
        name: 'Damansara Uptown',
        archetype: 'RETAIL_MALL',
        latitude: 3.135,
        longitude: 101.621,
        capacity: 2200,
        base_occupancy: 0.6,
        traffic_multiplier: 1.36,
    },
];
const RESIDENTIAL_FALLBACK = {
    hub_index: 5,
    name: 'Residential Local Area',
    archetype: 'RESIDENTIAL_LOCAL',
    latitude: 3.12,
    longitude: 101.63,
    capacity: 500,
    base_occupancy: 0.2,
    traffic_multiplier: 1.0,
};
let DemandForecastService = DemandForecastService_1 = class DemandForecastService {
    constructor() {
        this.logger = new common_1.Logger(DemandForecastService_1.name);
        this.metadata = null;
        this.hubs = DEFAULT_HUBS;
        this.loadMetadata();
    }
    loadMetadata() {
        const candidatePaths = [
            path.resolve(process.cwd(), 'scripts/ml/demand_model_metadata.json'),
            path.resolve(process.cwd(), '../scripts/ml/demand_model_metadata.json'),
            path.resolve(__dirname, '../../../../../../scripts/ml/demand_model_metadata.json'),
            path.resolve(__dirname, '../../../../../scripts/ml/demand_model_metadata.json'),
        ];
        for (const p of candidatePaths) {
            if (fs.existsSync(p)) {
                try {
                    const raw = fs.readFileSync(p, 'utf-8');
                    this.metadata = JSON.parse(raw);
                    if (Array.isArray(this.metadata.hubs)) {
                        this.hubs = this.metadata.hubs.filter((h) => h.archetype !== 'RESIDENTIAL_LOCAL');
                    }
                    this.logger.log(`Loaded zoning-aware demand metadata successfully from ${p}`);
                    return;
                }
                catch (err) {
                    this.logger.warn(`Failed parsing demand model metadata at ${p}: ${err.message}`);
                }
            }
        }
        this.logger.warn('demand_model_metadata.json not found on disk. Initializing with calibrated default urban demand engine.');
    }
    getForecast(query) {
        const hub = this.resolveNearestHub(query);
        const nowUtc = query.simulatedDate || new Date();
        const utcHours = nowUtc.getUTCHours();
        const klHour = query.simulatedHour !== undefined
            ? query.simulatedHour
            : (utcHours + 8) % 24;
        const utcDay = nowUtc.getUTCDay();
        const isNextDay = utcHours + 8 >= 24;
        const klDayOfWeek = query.simulatedDayOfWeek !== undefined
            ? query.simulatedDayOfWeek
            : (utcDay + (isNextDay ? 1 : 0)) % 7;
        const isFriNight = klDayOfWeek === 5 && klHour >= 21;
        const isSatEarly = klDayOfWeek === 6 && klHour <= 2;
        const isSatNight = klDayOfWeek === 6 && klHour >= 21;
        const isSunEarly = klDayOfWeek === 0 && klHour <= 2;
        const isWeekendNightlifeSurge = isFriNight || isSatEarly || isSatNight || isSunEarly;
        if (hub.archetype === 'NIGHTLIFE_ENTERTAINMENT' && isWeekendNightlifeSurge) {
            return {
                hubName: hub.name,
                archetype: 'NIGHTLIFE_ENTERTAINMENT',
                occupancyRate: 0.88,
                demandLevel: 'CRITICAL',
                turnoverMinutes: 2.5,
                isPeakHour: true,
                recommendedMode: 'P2P_HANDOFF',
                estimatedCruisingMinutesSaved: 22,
                peakWindowLabel: 'Weekend Nightlife & Dining Peak (9:00 PM – 2:00 AM)',
            };
        }
        if (hub.archetype === 'RETAIL_MALL' && (klHour >= 22 || klHour < 7)) {
            return {
                hubName: hub.name,
                archetype: 'RETAIL_MALL',
                occupancyRate: 0.3,
                demandLevel: 'LOW',
                turnoverMinutes: 14.5,
                isPeakHour: false,
                recommendedMode: 'CRUISING_PERMITTED',
                estimatedCruisingMinutesSaved: 3,
                peakWindowLabel: 'Post-Mall Closing Wind-Down',
            };
        }
        if (hub.archetype === 'RESIDENTIAL_LOCAL') {
            const occ = klHour >= 21 || klHour < 7 ? 0.18 : 0.28;
            return {
                hubName: hub.name,
                archetype: 'RESIDENTIAL_LOCAL',
                occupancyRate: occ,
                demandLevel: 'LOW',
                turnoverMinutes: 18.0,
                isPeakHour: false,
                recommendedMode: 'CRUISING_PERMITTED',
                estimatedCruisingMinutesSaved: 2,
                peakWindowLabel: 'Quiet Residential Neighborhood',
            };
        }
        const isWeekend = klDayOfWeek === 0 || klDayOfWeek === 6;
        const dayKey = isFriNight ? 'friday_eve' : isWeekend ? 'weekend' : 'weekday';
        if (this.metadata?.hourly_profiles?.[hub.name]?.[dayKey]?.[klHour.toString()]) {
            const profile = this.metadata.hourly_profiles[hub.name][dayKey][klHour.toString()];
            return {
                hubName: hub.name,
                archetype: hub.archetype,
                occupancyRate: profile.occupancy_rate,
                demandLevel: profile.demand_level,
                turnoverMinutes: profile.turnover_minutes,
                isPeakHour: profile.is_peak_hour,
                recommendedMode: profile.recommended_mode,
                estimatedCruisingMinutesSaved: profile.estimated_cruising_saved_mins,
                peakWindowLabel: profile.peak_window_label || this.getPeakWindowLabel(klHour, hub.archetype),
            };
        }
        return this.calculateHeuristicForecast(hub, klHour, isWeekend, isWeekendNightlifeSurge);
    }
    resolveNearestHub(query) {
        if (query.destinationName) {
            const lower = query.destinationName.toLowerCase();
            const residentialKeywords = [
                'residential',
                'taman',
                'housing',
                'lorong',
                'condo',
                'condominium',
                'apartment',
                'flat',
                'kampung',
                'residential neighborhood',
            ];
            for (const kw of residentialKeywords) {
                if (lower.includes(kw)) {
                    return {
                        ...RESIDENTIAL_FALLBACK,
                        name: query.destinationName,
                    };
                }
            }
            if (lower.includes('bukit bintang') ||
                lower.includes('pavilion') ||
                lower.includes('changkat') ||
                lower.includes('alor')) {
                return this.hubs.find((h) => h.name === 'Bukit Bintang') || this.hubs[3];
            }
            if (lower.includes('bangsar') || lower.includes('telawi')) {
                return this.hubs.find((h) => h.name === 'Bangsar Telawi') || this.hubs[1];
            }
            if (lower.includes('mid valley') ||
                lower.includes('megamall') ||
                lower.includes('the gardens')) {
                return this.hubs.find((h) => h.name === 'Mid Valley Megamall') || this.hubs[0];
            }
            if (lower.includes('uptown') ||
                lower.includes('damansara uptown') ||
                lower.includes('starling')) {
                return this.hubs.find((h) => h.name === 'Damansara Uptown') || this.hubs[4];
            }
            if (lower.includes('ss15') ||
                lower.includes('subang jaya') ||
                lower.includes('subang') ||
                lower.includes('inti')) {
                return this.hubs.find((h) => h.name === 'SS15 Subang Jaya') || this.hubs[2];
            }
        }
        if (query.latitude !== undefined && query.longitude !== undefined) {
            let closestHub = this.hubs[0];
            let minDistance = Infinity;
            for (const hub of this.hubs) {
                const dist = this.haversineMeters(query.latitude, query.longitude, hub.latitude, hub.longitude);
                if (dist < minDistance) {
                    minDistance = dist;
                    closestHub = hub;
                }
            }
            if (minDistance > 2000.0) {
                return {
                    ...RESIDENTIAL_FALLBACK,
                    name: query.destinationName || 'Local Residential Area',
                    latitude: query.latitude,
                    longitude: query.longitude,
                };
            }
            return closestHub;
        }
        return this.hubs[0];
    }
    calculateHeuristicForecast(hub, hour, isWeekend, isWeekendNightlifeSurge) {
        let occ = 0.55;
        let demandLevel = 'MODERATE';
        let turnoverMinutes = 8.5;
        let cruisingSaved = 10;
        let recommendedMode = 'P2P_HANDOFF';
        let isPeakHour = false;
        let windowLabel = 'Regular Turnover Period';
        if (hub.archetype === 'NIGHTLIFE_ENTERTAINMENT' && isWeekendNightlifeSurge) {
            occ = 0.88;
            demandLevel = 'CRITICAL';
            turnoverMinutes = 2.5;
            cruisingSaved = 22;
            isPeakHour = true;
            windowLabel = 'Weekend Nightlife & Dining Peak (9:00 PM – 2:00 AM)';
        }
        else if (hub.archetype === 'RETAIL_MALL' && (hour >= 22 || hour < 7)) {
            occ = 0.3;
            demandLevel = 'LOW';
            turnoverMinutes = 14.5;
            cruisingSaved = 3;
            recommendedMode = 'CRUISING_PERMITTED';
            isPeakHour = false;
            windowLabel = 'Post-Mall Closing Wind-Down';
        }
        else if (hub.archetype === 'RESIDENTIAL_LOCAL') {
            occ = 0.18;
            demandLevel = 'LOW';
            turnoverMinutes = 18.0;
            cruisingSaved = 2;
            recommendedMode = 'CRUISING_PERMITTED';
            isPeakHour = false;
            windowLabel = 'Quiet Residential Neighborhood';
        }
        else {
            if (hour >= 11 && hour <= 14) {
                occ = 0.86;
                demandLevel = 'HIGH';
                turnoverMinutes = 4.2;
                cruisingSaved = 18;
                isPeakHour = true;
                windowLabel = 'Peak Turnover Zone (12:00 PM – 2:30 PM)';
            }
            else if (hour >= 18 && hour <= 21) {
                occ = 0.88;
                demandLevel = 'HIGH';
                turnoverMinutes = 4.0;
                cruisingSaved = 20;
                isPeakHour = true;
                windowLabel = 'Evening Peak Zone (6:00 PM – 9:30 PM)';
            }
            else if (hour >= 7 && hour <= 10) {
                occ = 0.68;
                demandLevel = 'MODERATE';
                turnoverMinutes = 7.5;
                cruisingSaved = 12;
                isPeakHour = !isWeekend;
                windowLabel = 'Morning Rush Period (7:30 AM – 9:30 AM)';
            }
            else {
                occ = 0.42;
                demandLevel = 'LOW';
                turnoverMinutes = 12.0;
                cruisingSaved = 5;
                recommendedMode = 'CRUISING_PERMITTED';
            }
        }
        return {
            hubName: hub.name,
            archetype: hub.archetype,
            occupancyRate: occ,
            demandLevel,
            turnoverMinutes,
            isPeakHour,
            recommendedMode,
            estimatedCruisingMinutesSaved: cruisingSaved,
            peakWindowLabel: windowLabel,
        };
    }
    getPeakWindowLabel(hour, archetype) {
        if (archetype === 'NIGHTLIFE_ENTERTAINMENT' && (hour >= 21 || hour <= 2)) {
            return 'Weekend Nightlife & Dining Peak (9:00 PM – 2:00 AM)';
        }
        if (archetype === 'RETAIL_MALL' && (hour >= 22 || hour < 7)) {
            return 'Post-Mall Closing Wind-Down';
        }
        if (archetype === 'RESIDENTIAL_LOCAL') {
            return 'Quiet Residential Neighborhood';
        }
        if (hour >= 11 && hour <= 14) {
            return 'Peak Turnover Zone (12:00 PM – 2:30 PM)';
        }
        if (hour >= 17 && hour <= 21) {
            return 'Evening Peak Zone (6:00 PM – 9:30 PM)';
        }
        if (hour >= 7 && hour <= 10) {
            return 'Morning Commute Period (7:30 AM – 9:30 AM)';
        }
        return 'Regular Activity Period';
    }
    haversineMeters(lat1, lon1, lat2, lon2) {
        const R = 6371000;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) *
                Math.cos((lat2 * Math.PI) / 180) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
};
exports.DemandForecastService = DemandForecastService;
exports.DemandForecastService = DemandForecastService = DemandForecastService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], DemandForecastService);
//# sourceMappingURL=demand-forecast.service.js.map