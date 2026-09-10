import { VerificationService } from '../../../src/modules/verification/application/services/verification.service';
import { GeofenceEngine } from '../../../src/modules/verification/domain/services/geofence.engine';
import { InMemoryDisputeRepository } from '../../../src/modules/verification/infrastructure/adapters/in-memory-dispute.repository';
import { InMemoryMatchRepository } from '../../../src/modules/matchmaker/infrastructure/adapters/in-memory-match.repository';
import { InMemoryUserRepository } from '../../../src/modules/auth/infrastructure/adapters/in-memory-user.repository';
import { InMemoryWalletRepository } from '../../../src/modules/wallet/infrastructure/adapters/in-memory-wallet.repository';
import { WalletService } from '../../../src/modules/wallet/application/services/wallet.service';
import { SettlementTransactionService } from '../../../src/modules/wallet/domain/services/settlement-transaction.service';
import { MockWalletService } from '../../../src/modules/wallet/application/services/mock-wallet.service';
import { ProbabilisticVacancyService } from '../../../src/modules/probabilistic/application/services/probabilistic-vacancy.service';
import { InMemoryProbabilisticSpotRepository } from '../../../src/modules/probabilistic/infrastructure/adapters/in-memory-probabilistic-spot.repository';
import { DecayEngine } from '../../../src/modules/probabilistic/domain/services/decay.engine';
import { SocketBroadcasterService } from '../../../src/modules/gateway/application/services/socket-broadcaster.service';
import { RoomManagerService } from '../../../src/modules/gateway/infrastructure/services/room-manager.service';
import { MatchEntity } from '../../../src/modules/matchmaker/domain/entities/match.entity';
import { MatchStatus } from '../../../src/modules/matchmaker/domain/enums/match-status.enum';
import { UserEntity } from '../../../src/modules/auth/domain/entities/user.entity';

describe('VerificationService (Module 7 Unit Tests)', () => {
  let verificationService: VerificationService;
  let matchRepo: InMemoryMatchRepository;
  let disputeRepo: InMemoryDisputeRepository;
  let userRepo: InMemoryUserRepository;
  let walletRepo: InMemoryWalletRepository;
  let probRepo: InMemoryProbabilisticSpotRepository;
  let broadcaster: SocketBroadcasterService;

  beforeEach(async () => {
    matchRepo = new InMemoryMatchRepository();
    disputeRepo = new InMemoryDisputeRepository();
    userRepo = new InMemoryUserRepository();
    walletRepo = new InMemoryWalletRepository();
    probRepo = new InMemoryProbabilisticSpotRepository();

    const geofenceEngine = new GeofenceEngine();
    const settlementService = new SettlementTransactionService(walletRepo);
    const mockWalletService = new MockWalletService(walletRepo);
    const walletService = new WalletService(walletRepo, settlementService, mockWalletService);

    const decayEngine = new DecayEngine();
    const probabilisticService = new ProbabilisticVacancyService(probRepo, decayEngine);

    const roomManager = new RoomManagerService();
    broadcaster = new SocketBroadcasterService(roomManager);

    verificationService = new VerificationService(
      disputeRepo,
      matchRepo,
      userRepo,
      geofenceEngine,
      walletService,
      probabilisticService,
      broadcaster,
    );

    // Setup users
    await userRepo.create(new UserEntity({ id: 'searcher-1', phoneNumber: '+60111111111' }));
    await userRepo.create(new UserEntity({ id: 'leaver-1', phoneNumber: '+60122222222' }));
  });

  it('should successfully confirm parking, mark match COMPLETED, and execute RM 0.50 / RM 0.25 settlement', async () => {
    const match = new MatchEntity({
      searcherId: 'searcher-1',
      leaverId: 'leaver-1',
      spotLatitude: 3.139,
      spotLongitude: 101.686,
      status: MatchStatus.EN_ROUTE,
    });
    await matchRepo.createMatch(match);

    const result = await verificationService.confirmParkedSuccess('searcher-1', { matchId: match.id });

    expect(result.success).toBe(true);
    expect(result.status).toBe(MatchStatus.COMPLETED);
    expect(result.settlement).toBeDefined();
    expect(result.settlement.searcherDebit).toBe(0.50);
    expect(result.settlement.leaverCredit).toBe(0.25);

    // Verify user match counts incremented
    const searcher = await userRepo.findById('searcher-1');
    const leaver = await userRepo.findById('leaver-1');
    expect(searcher?.totalCompletedMatches).toBe(1);
    expect(leaver?.totalCompletedMatches).toBe(1);
  });

  it('should handle Spot Taken by Someone Else report with RM 0.00 charge and fallback rerouting', async () => {
    // Add a candidate fallback spot nearby
    await probRepo.create(
      new (require('../../../src/modules/probabilistic/domain/entities/probabilistic-spot.entity').ProbabilisticSpotEntity)({
        latitude: 3.1392,
        longitude: 101.6869,
        landmarkNote: 'Fallback Spot 100m away',
      }),
    );

    const match = new MatchEntity({
      searcherId: 'searcher-1',
      leaverId: 'leaver-1',
      spotLatitude: 3.139,
      spotLongitude: 101.686,
      status: MatchStatus.EN_ROUTE,
    });
    await matchRepo.createMatch(match);

    const result = await verificationService.reportSpotTaken('searcher-1', {
      matchId: match.id,
      description: 'Another car pulled into the spot first',
    });

    expect(result.success).toBe(true);
    expect(result.chargeAmount).toBe(0.0);
    expect(result.disputeReportId).toBeDefined();
    expect(result.fallbackCandidates.length).toBeGreaterThan(0);

    const updatedMatch = await matchRepo.findById(match.id);
    expect(updatedMatch?.status).toBe(MatchStatus.FAILED_SPOT_TAKEN);
  });
});
