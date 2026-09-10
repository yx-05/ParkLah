"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const wallet_service_1 = require("../../../src/modules/wallet/application/services/wallet.service");
const mock_wallet_service_1 = require("../../../src/modules/wallet/application/services/mock-wallet.service");
const settlement_transaction_service_1 = require("../../../src/modules/wallet/domain/services/settlement-transaction.service");
const in_memory_wallet_repository_1 = require("../../../src/modules/wallet/infrastructure/adapters/in-memory-wallet.repository");
const exceptions_1 = require("../../../src/common/exceptions");
describe('WalletService & Operations (Module 8 Unit Tests)', () => {
    let walletRepo;
    let settlementService;
    let mockWalletService;
    let walletService;
    beforeEach(() => {
        walletRepo = new in_memory_wallet_repository_1.InMemoryWalletRepository();
        settlementService = new settlement_transaction_service_1.SettlementTransactionService(walletRepo);
        mockWalletService = new mock_wallet_service_1.MockWalletService(walletRepo);
        walletService = new wallet_service_1.WalletService(walletRepo, settlementService, mockWalletService);
    });
    it('should initialize default mock wallet with RM 20.00 balance', async () => {
        const userId = 'user-test-1';
        const balance = await walletService.getBalance(userId);
        expect(balance.balance).toBe(20.0);
        expect(balance.formattedBalance).toBe('RM 20.00');
        expect(balance.currency).toBe('MYR');
    });
    it('should increase balance upon mock top-up and record ledger transaction', async () => {
        const userId = 'user-test-1';
        const res = await walletService.topUp(userId, { amount: 10.0 });
        expect(res.balance).toBe(30.0);
        expect(res.formattedBalance).toBe('RM 30.00');
        expect(res.transaction.amount).toBe(10.0);
        expect(res.transaction.type).toBe('MOCK_TOPUP');
        const history = await walletService.getTransactions(userId);
        expect(history.total).toBe(1);
        expect(history.transactions[0].amount).toBe(10.0);
    });
    it('should decrease balance upon mock cash-out', async () => {
        const userId = 'user-test-1';
        const res = await walletService.cashOut(userId, { amount: 5.0 });
        expect(res.balance).toBe(15.0);
        expect(res.formattedBalance).toBe('RM 15.00');
        expect(res.transaction.amount).toBe(-5.0);
        expect(res.transaction.type).toBe('MOCK_CASHOUT');
    });
    it('should reject cash-out when amount exceeds available balance', async () => {
        const userId = 'user-test-1';
        await expect(walletService.cashOut(userId, { amount: 50.0 })).rejects.toThrow(exceptions_1.InsufficientWalletBalanceException);
    });
});
//# sourceMappingURL=wallet.service.spec.js.map