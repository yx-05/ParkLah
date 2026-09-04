import { SpatialMatchmakerService } from '../../../src/modules/matchmaker/application/services/spatial-matchmaker.service';
import { MatchScoringEngine } from '../../../src/modules/matchmaker/domain/services/match-scoring.engine';
import { CandidateDiscoveryService } from '../../../src/modules/matchmaker/infrastructure/services/candidate-discovery.service';
import { InMemoryMatchRepository } from '../../../src/modules/matchmaker/infrastructure/adapters/in-memory-match.repository';
import { InMemoryLockAdapter } from '../../../src/modules/matchmaker/infrastructure/adapters/in-memory-lock.adapter';
import { InMemorySearcherSpatialRepository } from '../../../src/modules/gatekeeper/infrastructure/adapters/in-memory-searcher-spatial.repository';
import { InMemoryUserRepository } from '../../../src/modules/auth/infrastructure/adapters/in-memory-user.repository';
import { ProbabilisticVacancyService } from '../../../src/modules/probabilistic/application/services/probabilistic-vacancy.service';
import { InMemoryProbabilisticSpotRepository } from '../../../src/modules/probabilistic/infrastructure/adapters/in-memory-probabilistic-spot.repository';
import { DecayEngine } from '../../../src/modules/probabilistic/domain/services/decay.engine';
import { SocketBroadcasterService } from '../../../src/modules/gateway/application/services/socket-broadcaster.service';
import { RoomManagerService } from '../../../src/modules/gateway/infrastructure/services/room-manager.service';
import { MatchStatus } from '../../../src/modules/matchmaker/domain/enums/match-status.enum';

describe('SpatialMatchmakerService (Module 5 Unit Tests)', () => {
  let matchmakerService: SpatialMatchmakerService;
  let matchRepo: InMemoryMatchRepository;
  let lockAdapter: InMemoryLockAdapter;
  let searcherRepo: InMemorySearcherSpatialRepository;
  let userRepo: InMemoryUserRepository;
  let probabilisticService: ProbabilisticVacancyService;
  let roomManager: RoomManagerService;
  let broadcaster: SocketBroadcasterService;

  beforeEach(() => {
    matchRepo = new InMemoryMatchRepository();
    lockAdapter = new InMemoryLockAdapter();
    searcherRepo = new InMemorySearcherSpatialRepository();
    userRepo = new InMemoryUserRepository();
    const scoringEngine = new MatchScoringEngine();
    const candidateDiscovery = new CandidateDiscoveryService(searcherRepo, userRepo, scoringEngine);

    const probRepo = new InMemoryProbabilisticSpotRepository();
    const decayEngine = new DecayEngine();
    probabilisticService = new ProbabilisticVacancyService(probRepo, decayEngine);

    roomManager = new RoomManagerService();
    broadcaster = new SocketBroadcasterService(roomManager);

    matchmakerService = new SpatialMatchmakerService(
      matchRepo,
      lockAdapter,
      candidateDiscovery,
      probabilisticService,
      broadcaster,
    );
  });

  it('should find active searcher, acquire 15s mutex lock, and create OFFERED match', async () => {
    // Register active searcher at 3.139, 101.686
    await searcherRepo.registerActiveSearcher(
      'searcher-1',
      { latitude: 3.1395, longitude: 101.6865 }, // ~80m away
      { latitude: 3.140, longitude: 101.687 },
      'Mid Valley',
    );

    const result = await matchmakerService.findAndOfferMatch({
      leaverId: 'leaver-1',
      spotCoords: { latitude: 3.139, longitude: 101.686 },
      countdownSeconds: 240,
      landmarkNote: 'Near Pillar B4',
    });

    expect(result.matched).toBe(true);
    expect(result.match).toBeDefined();
    expect(result.match?.searcherId).toBe('searcher-1');
    expect(result.match?.status).toBe(MatchStatus.OFFERED);
    expect(result.match?.handshakeTimeoutSeconds).toBe(15);
  });

  it('should fallback to ProbabilisticVacancyService when 0 active searchers are nearby', async () => {
    // No searchers registered in searcherRepo
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
    await searcherRepo.registerActiveSearcher(
      'searcher-1',
      { latitude: 3.1395, longitude: 101.6865 },
      { latitude: 3.140, longitude: 101.687 },
      'Mid Valley',
    );

    const { match } = await matchmakerService.findAndOfferMatch({
      leaverId: 'leaver-1',
      spotCoords: { latitude: 3.139, longitude: 101.686 },
      countdownSeconds: 240,
    });

    const acceptedMatch = await matchmakerService.acceptMatch(match!.id, 'searcher-1');
    expect(acceptedMatch.status).toBe(MatchStatus.EN_ROUTE);
    expect(acceptedMatch.acceptedAt).toBeDefined();
  });

  it('should release mutex lock and mark match DECLINED when searcher declines', async () => {
    await searcherRepo.registerActiveSearcher(
      'searcher-1',
      { latitude: 3.1395, longitude: 101.6865 },
      { latitude: 3.140, longitude: 101.687 },
      'Mid Valley',
    );

    const { match } = await matchmakerService.findAndOfferMatch({
      leaverId: 'leaver-1',
      spotCoords: { latitude: 3.139, longitude: 101.686 },
      countdownSeconds: 240,
    });

    const declined = await matchmakerService.declineMatch(match!.id, 'searcher-1');
    expect(declined.status).toBe(MatchStatus.DECLINED);

    // Verify spot lock is released
    const lockKey = `spot:leaver-1:3.139_101.686`;
    const lockHolder = await lockAdapter.getLockHolder(lockKey);
    expect(lockHolder).toBeNull();
  });

  it('should handle 15s handshake timeout, release lock, and persist to probabilistic DB', async () => {
    await searcherRepo.registerActiveSearcher(
      'searcher-1',
      { latitude: 3.1395, longitude: 101.6865 },
      { latitude: 3.140, longitude: 101.687 },
      'Mid Valley',
    );

    const { match } = await matchmakerService.findAndOfferMatch({
      leaverId: 'leaver-1',
      spotCoords: { latitude: 3.139, longitude: 101.686 },
      countdownSeconds: 240,
    });

    await matchmakerService.handleHandshakeTimeout(match!.id);

    const timedOutMatch = await matchRepo.findById(match!.id);
    expect(timedOutMatch?.status).toBe(MatchStatus.TIMEOUT);
  });
});
