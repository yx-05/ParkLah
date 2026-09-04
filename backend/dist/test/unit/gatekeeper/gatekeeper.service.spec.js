"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const gatekeeper_service_1 = require("../../../src/modules/gatekeeper/application/services/gatekeeper.service");
const gatekeeper_evaluator_service_1 = require("../../../src/modules/gatekeeper/domain/services/gatekeeper-evaluator.service");
const mock_google_maps_adapter_1 = require("../../../src/modules/gatekeeper/infrastructure/adapters/mock-google-maps.adapter");
const in_memory_searcher_spatial_repository_1 = require("../../../src/modules/gatekeeper/infrastructure/adapters/in-memory-searcher-spatial.repository");
const exceptions_1 = require("../../../src/common/exceptions");
describe('GatekeeperService (Module 3 Unit Tests)', () => {
    let gatekeeperService;
    let mockRoutingAdapter;
    let spatialRepo;
    let evaluator;
    beforeEach(() => {
        mockRoutingAdapter = new mock_google_maps_adapter_1.MockGoogleMapsRoutingAdapter();
        spatialRepo = new in_memory_searcher_spatial_repository_1.InMemorySearcherSpatialRepository();
        evaluator = new gatekeeper_evaluator_service_1.GatekeeperEvaluatorService();
        gatekeeperService = new gatekeeper_service_1.GatekeeperService(mockRoutingAdapter, spatialRepo, evaluator);
    });
    it('should lock matchmaking when distance is 4.5km even if ETA is 8 minutes', async () => {
        mockRoutingAdapter.setMockedMetrics(4500, 480);
        const evaluation = await gatekeeperService.evaluateDestination({
            origin: { latitude: 3.100, longitude: 101.600 },
            destination: { latitude: 3.140, longitude: 101.686, name: 'Mid Valley Megamall' },
        });
        expect(evaluation.isUnlocked).toBe(false);
        expect(evaluation.distanceMeters).toBe(4500);
        expect(evaluation.durationSeconds).toBe(480);
        expect(evaluation.reason).toContain('Distance exceeds 3.0km');
    });
    it('should lock matchmaking when ETA is 14 minutes even if distance is 2.0km', async () => {
        mockRoutingAdapter.setMockedMetrics(2000, 840);
        const evaluation = await gatekeeperService.evaluateDestination({
            origin: { latitude: 3.130, longitude: 101.680 },
            destination: { latitude: 3.140, longitude: 101.686, name: 'KLCC' },
        });
        expect(evaluation.isUnlocked).toBe(false);
        expect(evaluation.distanceMeters).toBe(2000);
        expect(evaluation.durationSeconds).toBe(840);
        expect(evaluation.reason).toContain('ETA exceeds 10 minutes');
    });
    it('should unlock matchmaking when distance is 1.8km and ETA is 6 minutes', async () => {
        mockRoutingAdapter.setMockedMetrics(1800, 360);
        const evaluation = await gatekeeperService.evaluateDestination({
            origin: { latitude: 3.135, longitude: 101.682 },
            destination: { latitude: 3.140, longitude: 101.686, name: 'Pavilion Bukit Bintang' },
        });
        expect(evaluation.isUnlocked).toBe(true);
        expect(evaluation.distanceMeters).toBe(1800);
        expect(evaluation.durationSeconds).toBe(360);
        expect(evaluation.reason).toBeUndefined();
    });
    it('should throw GatekeeperLockedException (403) when starting matchmaking in locked state', async () => {
        mockRoutingAdapter.setMockedMetrics(5000, 900);
        await expect(gatekeeperService.startMatchmaking('searcher-locked-user', {
            destCoords: { latitude: 3.140, longitude: 101.686 },
            destName: 'Mid Valley',
        }, { latitude: 3.090, longitude: 101.600 })).rejects.toThrow(exceptions_1.GatekeeperLockedException);
    });
    it('should register searcher in active spatial queue when starting matchmaking in unlocked state', async () => {
        mockRoutingAdapter.setMockedMetrics(1500, 300);
        const session = await gatekeeperService.startMatchmaking('searcher-valid-user', {
            destCoords: { latitude: 3.140, longitude: 101.686 },
            destName: 'Mid Valley',
            radiusMeters: 1000,
        }, { latitude: 3.135, longitude: 101.680 });
        expect(session.searcherId).toBe('searcher-valid-user');
        expect(session.destName).toBe('Mid Valley');
        const activeSession = await gatekeeperService.getActiveSearcherSession('searcher-valid-user');
        expect(activeSession).toBeDefined();
        expect(activeSession?.searcherId).toBe('searcher-valid-user');
        const stopResult = await gatekeeperService.stopMatchmaking('searcher-valid-user');
        expect(stopResult.success).toBe(true);
        const clearedSession = await gatekeeperService.getActiveSearcherSession('searcher-valid-user');
        expect(clearedSession).toBeNull();
    });
});
//# sourceMappingURL=gatekeeper.service.spec.js.map