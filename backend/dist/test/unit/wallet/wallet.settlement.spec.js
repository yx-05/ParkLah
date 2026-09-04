"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const settlement_transaction_service_1 = require("../../../src/modules/wallet/domain/services/settlement-transaction.service");
const in_memory_wallet_repository_1 = require("../../../src/modules/wallet/infrastructure/adapters/in-memory-wallet.repository");
const wallet_entity_1 = require("../../../src/modules/wallet/domain/entities/wallet.entity");
const exceptions_1 = require("../../../src/common/exceptions");
describe('SettlementTransactionService (Module 8 Unit Tests)', () => {
    let walletRepo;
    let settlementService;
    beforeEach(() => {
        walletRepo = new in_memory_wallet_repository_1.InMemoryWalletRepository();
        settlementService = new settlement_transaction_service_1.SettlementTransactionService(walletRepo);
    });
    it('should atomically deduct RM 0.50 from Searcher and credit RM 0.25 to Leaver', async () => {
        const searcherId = 'searcher-1';
        const leaverId = 'leaver-1';
        const matchId = 'match-xyz-123';
        await walletRepo.createWallet(new wallet_entity_1.WalletEntity({ userId: searcherId, balance: 10.0 }));
        await walletRepo.createWallet(new wallet_entity_1.WalletEntity({ userId: leaverId, balance: 5.0 }));
        const result = await settlementService.executeHandoffSettlement(searcherId, leaverId, matchId);
        expect(result.success).toBe(true);
        expect(result.searcherDebit).toBe(0.50);
        expect(result.leaverCredit).toBe(0.25);
        expect(result.platformFee).toBe(0.25);
        expect(result.searcherBalanceAfter).toBe(9.50);
        expect(result.leaverBalanceAfter).toBe(5.25);
        const searcherWallet = await walletRepo.findByUserId(searcherId);
        const leaverWallet = await walletRepo.findByUserId(leaverId);
        expect(searcherWallet?.balance).toBe(9.50);
        expect(leaverWallet?.balance).toBe(5.25);
        const searcherDebitTx = await walletRepo.getLedgerEntryByIdempotencyKey(`match:${matchId}:searcher:debit`);
        const leaverCreditTx = await walletRepo.getLedgerEntryByIdempotencyKey(`match:${matchId}:leaver:credit`);
        expect(searcherDebitTx).toBeDefined();
        expect(searcherDebitTx?.amount).toBe(-0.50);
        expect(searcherDebitTx?.transactionType).toBe('SEARCHER_HANDOFF_FEE');
        expect(leaverCreditTx).toBeDefined();
        expect(leaverCreditTx?.amount).toBe(0.25);
        expect(leaverCreditTx?.transactionType).toBe('LEAVER_HANDOFF_REWARD');
    });
    it('should reject settlement if Searcher wallet balance is less than RM 0.50', async () => {
        const searcherId = 'poor-searcher';
        const leaverId = 'leaver-1';
        const matchId = 'match-abc-456';
        await walletRepo.createWallet(new wallet_entity_1.WalletEntity({ userId: searcherId, balance: 0.30 }));
        await walletRepo.createWallet(new wallet_entity_1.WalletEntity({ userId: leaverId, balance: 5.0 }));
        await expect(settlementService.executeHandoffSettlement(searcherId, leaverId, matchId)).rejects.toThrow(exceptions_1.InsufficientWalletBalanceException);
        const searcherWallet = await walletRepo.findByUserId(searcherId);
        const leaverWallet = await walletRepo.findByUserId(leaverId);
        expect(searcherWallet?.balance).toBe(0.30);
        expect(leaverWallet?.balance).toBe(5.0);
    });
    it('should reject duplicate settlement with same matchId (idempotency)', async () => {
        const searcherId = 'searcher-1';
        const leaverId = 'leaver-1';
        const matchId = 'match-idempotent-test';
        await walletRepo.createWallet(new wallet_entity_1.WalletEntity({ userId: searcherId, balance: 10.0 }));
        await walletRepo.createWallet(new wallet_entity_1.WalletEntity({ userId: leaverId, balance: 5.0 }));
        await settlementService.executeHandoffSettlement(searcherId, leaverId, matchId);
        await expect(settlementService.executeHandoffSettlement(searcherId, leaverId, matchId)).rejects.toThrow(/already been executed/);
    });
});
//# sourceMappingURL=wallet.settlement.spec.js.map