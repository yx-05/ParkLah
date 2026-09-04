"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const spatial_matchmaker_service_1 = require("../../../src/modules/matchmaker/application/services/spatial-matchmaker.service");
const match_scoring_engine_1 = require("../../../src/modules/matchmaker/domain/services/match-scoring.engine");
const candidate_discovery_service_1 = require("../../../src/modules/matchmaker/infrastructure/services/candidate-discovery.service");
const in_memory_match_repository_1 = require("../../../src/modules/matchmaker/infrastructure/adapters/in-memory-match.repository");
const in_memory_lock_adapter_1 = require("../../../src/modules/matchmaker/infrastructure/adapters/in-memory-lock.adapter");
const in_memory_searcher_spatial_repository_1 = require("../../../src/modules/gatekeeper/infrastructure/adapters/in-memory-searcher-spatial.repository");
const in_memory_user_repository_1 = require("../../../src/modules/auth/infrastructure/adapters/in-memory-user.repository");
const probabilistic_vacancy_service_1 = require("../../../src/modules/probabilistic/application/services/probabilistic-vacancy.service");
const in_memory_probabilistic_spot_repository_1 = require("../../../src/modules/probabilistic/infrastructure/adapters/in-memory-probabilistic-spot.repository");
const decay_engine_1 = require("../../../src/modules/probabilistic/domain/services/decay.engine");
const socket_broadcaster_service_1 = require("../../../src/modules/gateway/application/services/socket-broadcaster.service");
const room_manager_service_1 = require("../../../src/modules/gateway/infrastructure/services/room-manager.service");
const match_status_enum_1 = require("../../../src/modules/matchmaker/domain/enums/match-status.enum");
describe('SpatialMatchmakerService (Module 5 Unit Tests)', () => {
    let matchmakerService;
    let matchRepo;
    let lockAdapter;
    let searcherRepo;
    let userRepo;
    let probabilisticService;
    let roomManager;
    let broadcaster;
    beforeEach(() => {
        matchRepo = new in_memory_match_repository_1.InMemoryMatchRepository();
        lockAdapter = new in_memory_lock_adapter_1.InMemoryLockAdapter();
        searcherRepo = new in_memory_searcher_spatial_repository_1.InMemorySearcherSpatialRepository();
        userRepo = new in_memory_user_repository_1.InMemoryUserRepository();
        const scoringEngine = new match_scoring_engine_1.MatchScoringEngine();
        const candidateDiscovery = new candidate_discovery_service_1.CandidateDiscoveryService(searcherRepo, userRepo, scoringEngine);
        const probRepo = new in_memory_probabilistic_spot_repository_1.InMemoryProbabilisticSpotRepository();
        const decayEngine = new decay_engine_1.DecayEngine();
        probabilisticService = new probabilistic_vacancy_service_1.ProbabilisticVacancyService(probRepo, decayEngine);
        roomManager = new room_manager_service_1.RoomManagerService();
        broadcaster = new socket_broadcaster_service_1.SocketBroadcasterService(roomManager);
        matchmakerService = new spatial_matchmaker_service_1.SpatialMatchmakerService(matchRepo, lockAdapter, candidateDiscovery, probabilisticService, broadcaster);
    });
    it('should find active searcher, acquire 15s mutex lock, and create OFFERED match', async () => {
        await searcherRepo.registerActiveSearcher('searcher-1', { latitude: 3.1395, longitude: 101.6865 }, { latitude: 3.140, longitude: 101.687 }, 'Mid Valley');
        const result = await matchmakerService.findAndOfferMatch({
            leaverId: 'leaver-1',
            spotCoords: { latitude: 3.139, longitude: 101.686 },
            countdownSeconds: 240,
            landmarkNote: 'Near Pillar B4',
        });
        expect(result.matched).toBe(true);
        expect(result.match).toBeDefined();
        expect(result.match?.searcherId).toBe('searcher-1');
        expect(result.match?.status).toBe(match_status_enum_1.MatchStatus.OFFERED);
        expect(result.match?.handshakeTimeoutSeconds).toBe(15);
    });
    it('should fallback to ProbabilisticVacancyService when 0 active searchers are nearby', async () => {
        const result = await matchmakerService.findAndOfferMatch({
            leaverId: 'leaver-lonely',
            spotCoords: { latitude: 3.139, longitude: 101.686 },
            countdownSeconds: 180,
            landmarkNote: 'Basement 2',
        });
        expect(result.matched).toBe(false);
        expect(result.fallbackSpotId).toBeDefined();
    });
    it('should transition match to EN_ROUTE when searcher accepts', async () => {
        await searcherRepo.registerActiveSearcher('searcher-1', { latitude: 3.1395, longitude: 101.6865 }, { latitude: 3.140, longitude: 101.687 }, 'Mid Valley');
        const { match } = await matchmakerService.findAndOfferMatch({
            leaverId: 'leaver-1',
            spotCoords: { latitude: 3.139, longitude: 101.686 },
            countdownSeconds: 240,
        });
        const acceptedMatch = await matchmakerService.acceptMatch(match.id, 'searcher-1');
        expect(acceptedMatch.status).toBe(match_status_enum_1.MatchStatus.EN_ROUTE);
        expect(acceptedMatch.acceptedAt).toBeDefined();
    });
    it('should release mutex lock and mark match DECLINED when searcher declines', async () => {
        await searcherRepo.registerActiveSearcher('searcher-1', { latitude: 3.1395, longitude: 101.6865 }, { latitude: 3.140, longitude: 101.687 }, 'Mid Valley');
        const { match } = await matchmakerService.findAndOfferMatch({
            leaverId: 'leaver-1',
            spotCoords: { latitude: 3.139, longitude: 101.686 },
            countdownSeconds: 240,
        });
        const declined = await matchmakerService.declineMatch(match.id, 'searcher-1');
        expect(declined.status).toBe(match_status_enum_1.MatchStatus.DECLINED);
        const lockKey = `spot:leaver-1:3.139_101.686`;
        const lockHolder = await lockAdapter.getLockHolder(lockKey);
        expect(lockHolder).toBeNull();
    });
    it('should handle 15s handshake timeout, release lock, and persist to probabilistic DB', async () => {
        await searcherRepo.registerActiveSearcher('searcher-1', { latitude: 3.1395, longitude: 101.6865 }, { latitude: 3.140, longitude: 101.687 }, 'Mid Valley');
        const { match } = await matchmakerService.findAndOfferMatch({
            leaverId: 'leaver-1',
            spotCoords: { latitude: 3.139, longitude: 101.686 },
            countdownSeconds: 240,
        });
        await matchmakerService.handleHandshakeTimeout(match.id);
        const timedOutMatch = await matchRepo.findById(match.id);
        expect(timedOutMatch?.status).toBe(match_status_enum_1.MatchStatus.TIMEOUT);
    });
});
//# sourceMappingURL=matchmaker.service.spec.js.map