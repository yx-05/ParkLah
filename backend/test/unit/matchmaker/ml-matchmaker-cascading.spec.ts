import { SpatialMatchmakerService } from '../../../src/modules/matchmaker/application/services/spatial-matchmaker.service';
import { CandidateDiscoveryService } from '../../../src/modules/matchmaker/infrastructure/services/candidate-discovery.service';
import { PharosCandidateFilterService } from '../../../src/modules/matchmaker/domain/services/pharos-candidate-filter.service';
import { OsrmRoadRoutingAdapter } from '../../../src/modules/matchmaker/infrastructure/adapters/osrm-road-routing.adapter';
import { OnnxMlMatchScoringAdapter } from '../../../src/modules/matchmaker/infrastructure/adapters/onnx-ml-match-scoring.adapter';
import { InMemoryMatchRepository } from '../../../src/modules/matchmaker/infrastructure/adapters/in-memory-match.repository';
import { InMemoryLockAdapter } from '../../../src/modules/matchmaker/infrastructure/adapters/in-memory-lock.adapter';
import { InMemorySearcherSpatialRepository } from '../../../src/modules/gatekeeper/infrastructure/adapters/in-memory-searcher-spatial.repository';
import { InMemoryUserRepository } from '../../../src/modules/auth/infrastructure/adapters/in-memory-user.repository';
import { ProbabilisticVacancyService } from '../../../src/modules/probabilistic/application/services/probabilistic-vacancy.service';
import { InMemoryProbabilisticSpotRepository } from '../../../src/modules/probabilistic/infrastructure/adapters/in-memory-probabilistic-spot.repository';
import { DecayEngine } from '../../../src/modules/probabilistic/domain/services/decay.engine';
import { SocketBroadcasterService } from '../../../src/modules/gateway/application/services/socket-broadcaster.service';
import { RoomManagerService } from '../../../src/modules/gateway/infrastructure/services/room-manager.service';
import { MlFeatureLoggerService } from '../../../src/modules/matchmaker/application/services/ml-feature-logger.service';
import { IMlFeatureRepositoryPort } from '../../../src/modules/matchmaker/domain/ports/ml-feature-repository.port';
import { MatchStatus } from '../../../src/modules/matchmaker/domain/enums/match-status.enum';

describe('ML Matchmaking & Cascading Lock End-to-End Pipeline', () => {
  let matchmakerService: SpatialMatchmakerService;
  let searcherRepo: InMemorySearcherSpatialRepository;
  let userRepo: InMemoryUserRepository;
  let matchRepo: InMemoryMatchRepository;
  let lockAdapter: InMemoryLockAdapter;
  let probabilisticService: ProbabilisticVacancyService;
  let probRepo: InMemoryProbabilisticSpotRepository;
  let broadcaster: SocketBroadcasterService;
  let mockFeatureRepo: jest.Mocked<IMlFeatureRepositoryPort>;

  const spotCoords = { latitude: 3.1177, longitude: 101.6774 }; // Mid Valley spot

  beforeEach(async () => {
    searcherRepo = new InMemorySearcherSpatialRepository();
    userRepo = new InMemoryUserRepository();
    matchRepo = new InMemoryMatchRepository();
    lockAdapter = new InMemoryLockAdapter();

    const pharosFilter = new PharosCandidateFilterService();
    // Use OSRM adapter with mock/fallback
    const roadRouting = new OsrmRoadRoutingAdapter('http://localhost:59999', 100);
    const mlScoring = new OnnxMlMatchScoringAdapter();
    await mlScoring.onModuleInit();

    const candidateDiscovery = new CandidateDiscoveryService(
      searcherRepo,
      userRepo,
      pharosFilter,
      roadRouting,
      mlScoring,
    );

    probRepo = new InMemoryProbabilisticSpotRepository();
    const decayEngine = new DecayEngine();
    probabilisticService = new ProbabilisticVacancyService(probRepo, decayEngine);

    const roomManager = new RoomManagerService();
    broadcaster = new SocketBroadcasterService(roomManager);

    mockFeatureRepo = {
      saveFeatureSnapshot: jest.fn().mockImplementation(async (r) => ({ ...r, id: 'feat-id-1' })),
      updateOutcome: jest.fn().mockResolvedValue(true),
      findRecentFeatures: jest.fn().mockResolvedValue([]),
    };
    const featureLogger = new MlFeatureLoggerService(mockFeatureRepo);

    matchmakerService = new SpatialMatchmakerService(
      matchRepo,
      lockAdapter,
      candidateDiscovery,
      probabilisticService,
      broadcaster,
      featureLogger,
    );
  });

  it('should rank candidates using LightGBM and match the highest probability driver first', async () => {
    // Register Driver A: 250m South, heading North (0 deg) directly to spot, high rating (4.9)
    await searcherRepo.registerActiveSearcher(
      'driver-A',
      { latitude: 3.1155, longitude: 101.6774 },
      spotCoords,
      'Mid Valley',
    );
    const sessionA = await searcherRepo.getActiveSearcherState('driver-A');
    if (sessionA) {
      sessionA.headingDegrees = 0;
      sessionA.speedKmh = 25;
      sessionA.gpsAccuracyMeters = 5;
    }

    // Register Driver B: 750m away, moderate heading alignment
    await searcherRepo.registerActiveSearcher(
      'driver-B',
      { latitude: 3.1110, longitude: 101.6774 },
      spotCoords,
      'Mid Valley',
    );
    const sessionB = await searcherRepo.getActiveSearcherState('driver-B');
    if (sessionB) {
      sessionB.headingDegrees = 45;
      sessionB.speedKmh = 30;
      sessionB.gpsAccuracyMeters = 10;
    }

    // Register Driver C: Close (300m) BUT heading directly AWAY (180 deg) at 50 km/h -> should be PRUNED by Pharos
    await searcherRepo.registerActiveSearcher(
      'driver-C',
      { latitude: 3.1150, longitude: 101.6774 },
      spotCoords,
      'Mid Valley',
    );
    const sessionC = await searcherRepo.getActiveSearcherState('driver-C');
    if (sessionC) {
      sessionC.headingDegrees = 180; // Heading away
      sessionC.speedKmh = 50; // High speed
      sessionC.gpsAccuracyMeters = 8;
    }

    // Leaver announces departure with 180s countdown
    const result = await matchmakerService.findAndOfferMatch({
      leaverId: 'leaver-user-1',
      spotCoords,
      countdownSeconds: 180,
      landmarkNote: 'Near North Court Pillar B2',
    });

    expect(result.matched).toBe(true);
    expect(result.match).toBeDefined();
    // Driver A should be picked first (Driver C was pruned by Pharos, Driver A outranks Driver B)
    expect(result.match?.searcherId).toBe('driver-A');
    expect(result.match?.status).toBe(MatchStatus.OFFERED);
    expect(result.predictedProbability).toBeGreaterThan(0.60);
    expect(result.dispatchRank).toBe(1);

    // Feature snapshot must be recorded
    expect(mockFeatureRepo.saveFeatureSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({
        searcherId: 'driver-A',
        leaverId: 'leaver-user-1',
        dispatchRank: 1,
      }),
    );
  });

  it('should cascade offer to candidate #2 when candidate #1 declines', async () => {
    // Register Driver A & Driver B
    await searcherRepo.registerActiveSearcher(
      'driver-A',
      { latitude: 3.1155, longitude: 101.6774 },
      spotCoords,
      'Mid Valley',
    );
    await searcherRepo.registerActiveSearcher(
      'driver-B',
      { latitude: 3.1120, longitude: 101.6774 },
      spotCoords,
      'Mid Valley',
    );

    // Initial offer goes to top-ranked driver
    const firstOffer = await matchmakerService.findAndOfferMatch({
      leaverId: 'leaver-user-1',
      spotCoords,
      countdownSeconds: 180,
    });
    expect(firstOffer.matched).toBe(true);
    const topDriverId = firstOffer.match!.searcherId;
    const backupDriverId = topDriverId === 'driver-B' ? 'driver-A' : 'driver-B';

    // Top driver declines the match
    await matchmakerService.declineMatch(firstOffer.match!.id, topDriverId);

    // Telemetry outcome updated for top driver
    expect(mockFeatureRepo.updateOutcome).toHaveBeenCalledWith(
      firstOffer.match!.id,
      0,
      'DECLINED',
      expect.any(Date),
    );

    // Next match offer cascades to backup driver
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
      spotCoords: { latitude: 4.5, longitude: 102.0 }, // Remote coordinates with 0 active drivers
      countdownSeconds: 180,
    });

    expect(result.matched).toBe(false);
    expect(result.fallbackSpotId).toBeDefined();

    const storedSpot = await probRepo.findById(result.fallbackSpotId!);
    expect(storedSpot).toBeDefined();
    expect(storedSpot?.leaverId).toBe('leaver-empty');
  });
});
