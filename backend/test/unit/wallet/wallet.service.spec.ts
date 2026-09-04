import { WalletService } from '../../../src/modules/wallet/application/services/wallet.service';
import { MockWalletService } from '../../../src/modules/wallet/application/services/mock-wallet.service';
import { SettlementTransactionService } from '../../../src/modules/wallet/domain/services/settlement-transaction.service';
import { InMemoryWalletRepository } from '../../../src/modules/wallet/infrastructure/adapters/in-memory-wallet.repository';
import { InsufficientWalletBalanceException } from '../../../src/common/exceptions';

describe('WalletService & Operations (Module 8 Unit Tests)', () => {
  let walletRepo: InMemoryWalletRepository;
  let settlementService: SettlementTransactionService;
  let mockWalletService: MockWalletService;
  let walletService: WalletService;

  beforeEach(() => {
    walletRepo = new InMemoryWalletRepository();
    settlementService = new SettlementTransactionService(walletRepo);
    mockWalletService = new MockWalletService(walletRepo);
    walletService = new WalletService(walletRepo, settlementService, mockWalletService);
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

    await expect(
      walletService.cashOut(userId, { amount: 50.0 }), // Balance is only 20.00
    ).rejects.toThrow(InsufficientWalletBalanceException);
  });
});
