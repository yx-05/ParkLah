import { WalletEntity } from '../entities/wallet.entity';
import { LedgerTransactionEntity } from '../entities/ledger-transaction.entity';

export const WALLET_REPOSITORY_PORT = Symbol('IWalletRepositoryPort');

export interface IWalletRepositoryPort {
  findByUserId(userId: string): Promise<WalletEntity | null>;
  findById(walletId: string): Promise<WalletEntity | null>;
  createWallet(wallet: WalletEntity): Promise<WalletEntity>;
  updateWallet(wallet: WalletEntity): Promise<WalletEntity>;
  recordLedgerEntry(transaction: LedgerTransactionEntity): Promise<LedgerTransactionEntity>;
  getLedgerEntryByIdempotencyKey(key: string): Promise<LedgerTransactionEntity | null>;
  getTransactionHistory(walletId: string, page?: number, limit?: number): Promise<{ transactions: LedgerTransactionEntity[]; total: number }>;
}
