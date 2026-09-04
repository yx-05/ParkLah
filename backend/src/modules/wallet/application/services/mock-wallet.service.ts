import { Injectable, Inject } from '@nestjs/common';
import { IWalletRepositoryPort, WALLET_REPOSITORY_PORT } from '../../domain/ports/wallet-repository.port';
import { WalletEntity } from '../../domain/entities/wallet.entity';
import { LedgerTransactionEntity } from '../../domain/entities/ledger-transaction.entity';

@Injectable()
export class MockWalletService {
  constructor(
    @Inject(WALLET_REPOSITORY_PORT)
    private readonly walletRepository: IWalletRepositoryPort,
  ) {}

  async mockTopUp(userId: string, amount: number): Promise<{ wallet: WalletEntity; transaction: LedgerTransactionEntity }> {
    let wallet = await this.walletRepository.findByUserId(userId);
    if (!wallet) {
      wallet = await this.walletRepository.createWallet(
        new WalletEntity({ userId, balance: 20.0 }),
      );
    }

    wallet.credit(amount);
    await this.walletRepository.updateWallet(wallet);

    const idempotencyKey = `mock:topup:${userId}:${Date.now()}:${Math.random().toString(36).substring(2, 7)}`;
    const tx = await this.walletRepository.recordLedgerEntry(
      new LedgerTransactionEntity({
        walletId: wallet.id,
        idempotencyKey,
        transactionType: 'MOCK_TOPUP',
        amount,
        balanceAfter: wallet.balance,
        status: 'COMPLETED',
        metadata: { topUpMethod: 'MOCK' },
      }),
    );

    return { wallet, transaction: tx };
  }

  async mockCashOut(userId: string, amount: number): Promise<{ wallet: WalletEntity; transaction: LedgerTransactionEntity }> {
    let wallet = await this.walletRepository.findByUserId(userId);
    if (!wallet) {
      wallet = await this.walletRepository.createWallet(
        new WalletEntity({ userId, balance: 20.0 }),
      );
    }

    wallet.debit(amount);
    await this.walletRepository.updateWallet(wallet);

    const idempotencyKey = `mock:cashout:${userId}:${Date.now()}:${Math.random().toString(36).substring(2, 7)}`;
    const tx = await this.walletRepository.recordLedgerEntry(
      new LedgerTransactionEntity({
        walletId: wallet.id,
        idempotencyKey,
        transactionType: 'MOCK_CASHOUT',
        amount: -amount,
        balanceAfter: wallet.balance,
        status: 'COMPLETED',
        metadata: { cashOutMethod: 'MOCK' },
      }),
    );

    return { wallet, transaction: tx };
  }
}
