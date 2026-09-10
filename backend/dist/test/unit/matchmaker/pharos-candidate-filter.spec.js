"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pharos_candidate_filter_service_1 = require("../../../src/modules/matchmaker/domain/services/pharos-candidate-filter.service");
describe('PharosCandidateFilterService', () => {
    let service;
    beforeEach(() => {
        service = new pharos_candidate_filter_service_1.PharosCandidateFilterService();
    });
    const spotCoords = { latitude: 3.1177, longitude: 101.6774 };
    it('should compute forward bearing correctly', () => {
        const southPoint = { latitude: 3.1000, longitude: 101.6774 };
        const bearingNorth = service.calculateBearing(southPoint, spotCoords);
        expect(bearingNorth).toBeCloseTo(0, 0);
        const westPoint = { latitude: 3.1177, longitude: 101.6600 };
        const bearingEast = service.calculateBearing(westPoint, spotCoords);
        expect(bearingEast).toBeCloseTo(90, 0);
    });
    it('should compute angular divergence correctly', () => {
        expect(service.calculateAngularDivergence(10, 350)).toBe(20);
        expect(service.calculateAngularDivergence(90, 270)).toBe(180);
        expect(service.calculateAngularDivergence(45, 60)).toBe(15);
    });
    it('should accept a qualified searching candidate moving toward the spot', () => {
        const candidate = {
            searcherId: 'searcher-1',
            currentCoords: { latitude: 3.1141, longitude: 101.6774 },
            destCoords: spotCoords,
            headingDegrees: 0,
            speedKmh: 28,
            gpsAccuracyMeters: 8,
            lastHeartbeat: new Date(),
            status: 'ACTIVE_SEARCHING',
        };
        const result = service.evaluateCandidate(candidate, spotCoords);
        expect(result.eligible).toBe(true);
        expect(result.angularDivergenceDeg).toBeLessThan(30);
    });
    it('should prune candidate with stale GPS heartbeat (>20s)', () => {
        const candidate = {
            searcherId: 'searcher-stale',
            currentCoords: { latitude: 3.1150, longitude: 101.6774 },
            destCoords: spotCoords,
            headingDegrees: 0,
            speedKmh: 20,
            gpsAccuracyMeters: 10,
            lastHeartbeat: new Date(Date.now() - 35000),
            status: 'ACTIVE_SEARCHING',
        };
        const result = service.evaluateCandidate(candidate, spotCoords);
        expect(result.eligible).toBe(false);
        expect(result.rejectReason).toBe('STALE_GPS_HEARTBEAT');
    });
    it('should prune candidate with poor GPS accuracy (>40m)', () => {
        const candidate = {
            searcherId: 'searcher-bad-gps',
            currentCoords: { latitude: 3.1150, longitude: 101.6774 },
            destCoords: spotCoords,
            headingDegrees: 0,
            speedKmh: 20,
            gpsAccuracyMeters: 55,
            lastHeartbeat: new Date(),
            status: 'ACTIVE_SEARCHING',
        };
        const result = service.evaluateCandidate(candidate, spotCoords);
        expect(result.eligible).toBe(false);
        expect(result.rejectReason).toBe('POOR_GPS_ACCURACY');
    });
    it('should prune candidate traveling at speed away from the spot (divergence > 120 deg & speed > 25 km/h)', () => {
        const candidate = {
            searcherId: 'searcher-heading-away',
            currentCoords: { latitude: 3.1150, longitude: 101.6774 },
            destCoords: spotCoords,
            headingDegrees: 180,
            speedKmh: 45,
            gpsAccuracyMeters: 10,
            lastHeartbeat: new Date(),
            status: 'ACTIVE_SEARCHING',
        };
        const result = service.evaluateCandidate(candidate, spotCoords);
        expect(result.eligible).toBe(false);
        expect(result.rejectReason).toBe('HEADING_DIVERGENCE_AT_SPEED');
        expect(result.angularDivergenceDeg).toBeGreaterThan(120);
    });
    it('should NOT prune candidate with high divergence if crawling/circling at low speed (<= 25 km/h)', () => {
        const candidate = {
            searcherId: 'searcher-slow-circling',
            currentCoords: { latitude: 3.1150, longitude: 101.6774 },
            destCoords: spotCoords,
            headingDegrees: 180,
            speedKmh: 12,
            gpsAccuracyMeters: 10,
            lastHeartbeat: new Date(),
            status: 'ACTIVE_SEARCHING',
        };
        const result = service.evaluateCandidate(candidate, spotCoords);
        expect(result.eligible).toBe(true);
    });
});
//# sourceMappingURL=pharos-candidate-filter.spec.js.map