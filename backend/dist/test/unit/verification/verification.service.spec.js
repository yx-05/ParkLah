"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const verification_service_1 = require("../../../src/modules/verification/application/services/verification.service");
const geofence_engine_1 = require("../../../src/modules/verification/domain/services/geofence.engine");
const in_memory_dispute_repository_1 = require("../../../src/modules/verification/infrastructure/adapters/in-memory-dispute.repository");
const in_memory_match_repository_1 = require("../../../src/modules/matchmaker/infrastructure/adapters/in-memory-match.repository");
const in_memory_user_repository_1 = require("../../../src/modules/auth/infrastructure/adapters/in-memory-user.repository");
const in_memory_wallet_repository_1 = require("../../../src/modules/wallet/infrastructure/adapters/in-memory-wallet.repository");
const wallet_service_1 = require("../../../src/modules/wallet/application/services/wallet.service");
const settlement_transaction_service_1 = require("../../../src/modules/wallet/domain/services/settlement-transaction.service");
const mock_wallet_service_1 = require("../../../src/modules/wallet/application/services/mock-wallet.service");
const probabilistic_vacancy_service_1 = require("../../../src/modules/probabilistic/application/services/probabilistic-vacancy.service");
const in_memory_probabilistic_spot_repository_1 = require("../../../src/modules/probabilistic/infrastructure/adapters/in-memory-probabilistic-spot.repository");
const decay_engine_1 = require("../../../src/modules/probabilistic/domain/services/decay.engine");
const socket_broadcaster_service_1 = require("../../../src/modules/gateway/application/services/socket-broadcaster.service");
const room_manager_service_1 = require("../../../src/modules/gateway/infrastructure/services/room-manager.service");
const match_entity_1 = require("../../../src/modules/matchmaker/domain/entities/match.entity");
const match_status_enum_1 = require("../../../src/modules/matchmaker/domain/enums/match-status.enum");
const user_entity_1 = require("../../../src/modules/auth/domain/entities/user.entity");
describe('VerificationService (Module 7 Unit Tests)', () => {
    let verificationService;
    let matchRepo;
    let disputeRepo;
    let userRepo;
    let walletRepo;
    let probRepo;
    let broadcaster;
    beforeEach(async () => {
        matchRepo = new in_memory_match_repository_1.InMemoryMatchRepository();
        disputeRepo = new in_memory_dispute_repository_1.InMemoryDisputeRepository();
        userRepo = new in_memory_user_repository_1.InMemoryUserRepository();
        walletRepo = new in_memory_wallet_repository_1.InMemoryWalletRepository();
        probRepo = new in_memory_probabilistic_spot_repository_1.InMemoryProbabilisticSpotRepository();
        const geofenceEngine = new geofence_engine_1.GeofenceEngine();
        const settlementService = new settlement_transaction_service_1.SettlementTransactionService(walletRepo);
        const mockWalletService = new mock_wallet_service_1.MockWalletService(walletRepo);
        const walletService = new wallet_service_1.WalletService(walletRepo, settlementService, mockWalletService);
        const decayEngine = new decay_engine_1.DecayEngine();
        const probabilisticService = new probabilistic_vacancy_service_1.ProbabilisticVacancyService(probRepo, decayEngine);
        const roomManager = new room_manager_service_1.RoomManagerService();
        broadcaster = new socket_broadcaster_service_1.SocketBroadcasterService(roomManager);
        verificationService = new verification_service_1.VerificationService(disputeRepo, matchRepo, userRepo, geofenceEngine, walletService, probabilisticService, broadcaster);
        await userRepo.create(new user_entity_1.UserEntity({ id: 'searcher-1', phoneNumber: '+60111111111' }));
        await userRepo.create(new user_entity_1.UserEntity({ id: 'leaver-1', phoneNumber: '+60122222222' }));
    });
    it('should successfully confirm parking, mark match COMPLETED, and execute RM 0.50 / RM 0.25 settlement', async () => {
        const match = new match_entity_1.MatchEntity({
            searcherId: 'searcher-1',
            leaverId: 'leaver-1',
            spotLatitude: 3.139,
            spotLongitude: 101.686,
            status: match_status_enum_1.MatchStatus.EN_ROUTE,
        });
        await matchRepo.createMatch(match);
        const result = await verificationService.confirmParkedSuccess('searcher-1', { matchId: match.id });
        expect(result.success).toBe(true);
        expect(result.status).toBe(match_status_enum_1.MatchStatus.COMPLETED);
        expect(result.settlement).toBeDefined();
        expect(result.settlement.searcherDebit).toBe(0.50);
        expect(result.settlement.leaverCredit).toBe(0.25);
        const searcher = await userRepo.findById('searcher-1');
        const leaver = await userRepo.findById('leaver-1');
        expect(searcher?.totalCompletedMatches).toBe(1);
        expect(leaver?.totalCompletedMatches).toBe(1);
    });
    it('should handle Spot Taken by Someone Else report with RM 0.00 charge and fallback rerouting', async () => {
        await probRepo.create(new (require('../../../src/modules/probabilistic/domain/entities/probabilistic-spot.entity').ProbabilisticSpotEntity)({
            latitude: 3.1392,
            longitude: 101.6869,
            landmarkNote: 'Fallback Spot 100m away',
        }));
        const match = new match_entity_1.MatchEntity({
            searcherId: 'searcher-1',
            leaverId: 'leaver-1',
            spotLatitude: 3.139,
            spotLongitude: 101.686,
            status: match_status_enum_1.MatchStatus.EN_ROUTE,
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
        expect(updatedMatch?.status).toBe(match_status_enum_1.MatchStatus.FAILED_SPOT_TAKEN);
    });
});
//# sourceMappingURL=verification.service.spec.js.map