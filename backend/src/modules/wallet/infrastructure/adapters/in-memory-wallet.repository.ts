import { Injectable } from '@nestjs/common';
import { IWalletRepositoryPort } from '../../domain/ports/wallet-repository.port';
import { WalletEntity } from '../../domain/entities/wallet.entity';
import { LedgerTransactionEntity } from '../../domain/entities/ledger-transaction.entity';

@Injectable()
export class InMemoryWalletRepository implements IWalletRepositoryPort {
  private wallets = new Map<string, WalletEntity>(); // key: walletId or userId
  private userToWalletId = new Map<string, string>(); // userId -> walletId
  private ledger = new Map<string, LedgerTransactionEntity>(); // idempotencyKey -> transaction
  private transactions: LedgerTransactionEntity[] = [];

  async findByUserId(userId: string): Promise<WalletEntity | null> {
    const walletId = this.userToWalletId.get(userId);
    if (!walletId) return null;
    return this.wallets.get(walletId) || null;
  }

  async findById(walletId: string): Promise<WalletEntity | null> {
    return this.wallets.get(walletId) || null;
  }

  async createWallet(wallet: WalletEntity): Promise<WalletEntity> {
    this.wallets.set(wallet.id, wallet);
    this.userToWalletId.set(wallet.userId, wallet.id);
    return wallet;
  }

  async updateWallet(wallet: WalletEntity): Promise<WalletEntity> {
    this.wallets.set(wallet.id, wallet);
    return wallet;
  }

  async recordLedgerEntry(transaction: LedgerTransactionEntity): Promise<LedgerTransactionEntity> {
    if (this.ledger.has(transaction.idempotencyKey)) {
      throw new Error(`Duplicate idempotency key: ${transaction.idempotencyKey}`);
    }
    this.ledger.set(transaction.idempotencyKey, transaction);
    this.transactions.push(transaction);
    return transaction;
  }

  async getLedgerEntryByIdempotencyKey(key: string): Promise<LedgerTransactionEntity | null> {
    return this.ledger.get(key) || null;
  }

  async getTransactionHistory(
    walletId: string,
    page = 1,
    limit = 20,
  ): Promise<{ transactions: LedgerTransactionEntity[]; total: number }> {
    const filtered = this.transactions
      .filter((t) => t.walletId === walletId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = filtered.length;
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return {
      transactions: paginated,
      total,
    };
  }

  public clear(): void {
    this.wallets.clear();
    this.userToWalletId.clear();
    this.ledger.clear();
    this.transactions = [];
  }
}
