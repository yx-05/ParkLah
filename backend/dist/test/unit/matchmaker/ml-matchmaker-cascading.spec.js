"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const spatial_matchmaker_service_1 = require("../../../src/modules/matchmaker/application/services/spatial-matchmaker.service");
const candidate_discovery_service_1 = require("../../../src/modules/matchmaker/infrastructure/services/candidate-discovery.service");
const pharos_candidate_filter_service_1 = require("../../../src/modules/matchmaker/domain/services/pharos-candidate-filter.service");
const osrm_road_routing_adapter_1 = require("../../../src/modules/matchmaker/infrastructure/adapters/osrm-road-routing.adapter");
const onnx_ml_match_scoring_adapter_1 = require("../../../src/modules/matchmaker/infrastructure/adapters/onnx-ml-match-scoring.adapter");
const in_memory_match_repository_1 = require("../../../src/modules/matchmaker/infrastructure/adapters/in-memory-match.repository");
const in_memory_lock_adapter_1 = require("../../../src/modules/matchmaker/infrastructure/adapters/in-memory-lock.adapter");
const in_memory_searcher_spatial_repository_1 = require("../../../src/modules/gatekeeper/infrastructure/adapters/in-memory-searcher-spatial.repository");
const in_memory_user_repository_1 = require("../../../src/modules/auth/infrastructure/adapters/in-memory-user.repository");
const probabilistic_vacancy_service_1 = require("../../../src/modules/probabilistic/application/services/probabilistic-vacancy.service");
const in_memory_probabilistic_spot_repository_1 = require("../../../src/modules/probabilistic/infrastructure/adapters/in-memory-probabilistic-spot.repository");
const decay_engine_1 = require("../../../src/modules/probabilistic/domain/services/decay.engine");
const socket_broadcaster_service_1 = require("../../../src/modules/gateway/application/services/socket-broadcaster.service");
const room_manager_service_1 = require("../../../src/modules/gateway/infrastructure/services/room-manager.service");
const ml_feature_logger_service_1 = require("../../../src/modules/matchmaker/application/services/ml-feature-logger.service");
const match_status_enum_1 = require("../../../src/modules/matchmaker/domain/enums/match-status.enum");
describe('ML Matchmaking & Cascading Lock End-to-End Pipeline', () => {
    let matchmakerService;
    let searcherRepo;
    let userRepo;
    let matchRepo;
    let lockAdapter;
    let probabilisticService;
    let probRepo;
    let broadcaster;
    let mockFeatureRepo;
    const spotCoords = { latitude: 3.1177, longitude: 101.6774 };
    beforeEach(async () => {
        searcherRepo = new in_memory_searcher_spatial_repository_1.InMemorySearcherSpatialRepository();
        userRepo = new in_memory_user_repository_1.InMemoryUserRepository();
        matchRepo = new in_memory_match_repository_1.InMemoryMatchRepository();
        lockAdapter = new in_memory_lock_adapter_1.InMemoryLockAdapter();
        const pharosFilter = new pharos_candidate_filter_service_1.PharosCandidateFilterService();
        const roadRouting = new osrm_road_routing_adapter_1.OsrmRoadRoutingAdapter('http://localhost:59999', 100);
        const mlScoring = new onnx_ml_match_scoring_adapter_1.OnnxMlMatchScoringAdapter();
        await mlScoring.onModuleInit();
        const candidateDiscovery = new candidate_discovery_service_1.CandidateDiscoveryService(searcherRepo, userRepo, pharosFilter, roadRouting, mlScoring);
        probRepo = new in_memory_probabilistic_spot_repository_1.InMemoryProbabilisticSpotRepository();
        const decayEngine = new decay_engine_1.DecayEngine();
        probabilisticService = new probabilistic_vacancy_service_1.ProbabilisticVacancyService(probRepo, decayEngine);
        const roomManager = new room_manager_service_1.RoomManagerService();
        broadcaster = new socket_broadcaster_service_1.SocketBroadcasterService(roomManager);
        mockFeatureRepo = {
            saveFeatureSnapshot: jest.fn().mockImplementation(async (r) => ({ ...r, id: 'feat-id-1' })),
            updateOutcome: jest.fn().mockResolvedValue(true),
            findRecentFeatures: jest.fn().mockResolvedValue([]),
        };
        const featureLogger = new ml_feature_logger_service_1.MlFeatureLoggerService(mockFeatureRepo);
        matchmakerService = new spatial_matchmaker_service_1.SpatialMatchmakerService(matchRepo, lockAdapter, candidateDiscovery, probabilisticService, broadcaster, featureLogger);
    });
    it('should rank candidates using LightGBM and match the highest probability driver first', async () => {
        await searcherRepo.registerActiveSearcher('driver-A', { latitude: 3.1155, longitude: 101.6774 }, spotCoords, 'Mid Valley');
        const sessionA = await searcherRepo.getActiveSearcherState('driver-A');
        if (sessionA) {
            sessionA.headingDegrees = 0;
            sessionA.speedKmh = 25;
            sessionA.gpsAccuracyMeters = 5;
        }
        await searcherRepo.registerActiveSearcher('driver-B', { latitude: 3.1110, longitude: 101.6774 }, spotCoords, 'Mid Valley');
        const sessionB = await searcherRepo.getActiveSearcherState('driver-B');
        if (sessionB) {
            sessionB.headingDegrees = 45;
            sessionB.speedKmh = 30;
            sessionB.gpsAccuracyMeters = 10;
        }
        await searcherRepo.registerActiveSearcher('driver-C', { latitude: 3.1150, longitude: 101.6774 }, spotCoords, 'Mid Valley');
        const sessionC = await searcherRepo.getActiveSearcherState('driver-C');
        if (sessionC) {
            sessionC.headingDegrees = 180;
            sessionC.speedKmh = 50;
            sessionC.gpsAccuracyMeters = 8;
        }
        const result = await matchmakerService.findAndOfferMatch({
            leaverId: 'leaver-user-1',
            spotCoords,
            countdownSeconds: 180,
            landmarkNote: 'Near North Court Pillar B2',
        });
        expect(result.matched).toBe(true);
        expect(result.match).toBeDefined();
        expect(result.match?.searcherId).toBe('driver-A');
        expect(result.match?.status).toBe(match_status_enum_1.MatchStatus.OFFERED);
        expect(result.predictedProbability).toBeGreaterThan(0.60);
        expect(result.dispatchRank).toBe(1);
        expect(mockFeatureRepo.saveFeatureSnapshot).toHaveBeenCalledWith(expect.objectContaining({
            searcherId: 'driver-A',
            leaverId: 'leaver-user-1',
            dispatchRank: 1,
        }));
    });
    it('should cascade offer to candidate #2 when candidate #1 declines', async () => {
        await searcherRepo.registerActiveSearcher('driver-A', { latitude: 3.1155, longitude: 101.6774 }, spotCoords, 'Mid Valley');
        await searcherRepo.registerActiveSearcher('driver-B', { latitude: 3.1120, longitude: 101.6774 }, spotCoords, 'Mid Valley');
        const firstOffer = await matchmakerService.findAndOfferMatch({
            leaverId: 'leaver-user-1',
            spotCoords,
            countdownSeconds: 180,
        });
        expect(firstOffer.matched).toBe(true);
        const topDriverId = firstOffer.match.searcherId;
        const backupDriverId = topDriverId === 'driver-B' ? 'driver-A' : 'driver-B';
        await matchmakerService.declineMatch(firstOffer.match.id, topDriverId);
        expect(mockFeatureRepo.updateOutcome).toHaveBeenCalledWith(firstOffer.match.id, 0, 'DECLINED', expect.any(Date));
        const secondOffer = await matchmakerService.findAndOfferMatch({
            leaverId: 'leaver-user-1',
            spotCoords,
            countdownSeconds: 180,
        });
        expect(secondOffer.matched).toBe(true);
        expect(secondOffer.match?.searcherId).toBe(backupDriverId);
    });
    it('should fall back to Probabilistic DB when 0 candidates are available or all pruned', async () => {
        const result = await matchmakerService.findAndOfferMatch({
            leaverId: 'leaver-empty',
            spotCoords: { latitude: 4.5, longitude: 102.0 },
            countdownSeconds: 180,
        });
        expect(result.matched).toBe(false);
        expect(result.fallbackSpotId).toBeDefined();
        const storedSpot = await probRepo.findById(result.fallbackSpotId);
        expect(storedSpot).toBeDefined();
        expect(storedSpot?.leaverId).toBe('leaver-empty');
    });
});
//# sourceMappingURL=ml-matchmaker-cascading.spec.js.map