import { Pool } from 'pg';
import { IWalletRepositoryPort } from '../../domain/ports/wallet-repository.port';
import { WalletEntity } from '../../domain/entities/wallet.entity';
import { LedgerTransactionEntity } from '../../domain/entities/ledger-transaction.entity';
export declare class PostgresWalletRepository implements IWalletRepositoryPort {
    private pool;
    constructor(pool?: Pool);
    findByUserId(userId: string): Promise<WalletEntity | null>;
    findById(walletId: string): Promise<WalletEntity | null>;
    createWallet(wallet: WalletEntity): Promise<WalletEntity>;
    updateWallet(wallet: WalletEntity): Promise<WalletEntity>;
    recordLedgerEntry(tx: LedgerTransactionEntity): Promise<LedgerTransactionEntity>;
    getLedgerEntryByIdempotencyKey(key: string): Promise<LedgerTransactionEntity | null>;
    getTransactionHistory(walletId: string, page?: number, limit?: number): Promise<{
        transactions: LedgerTransactionEntity[];
        total: number;
    }>;
    private mapToWalletEntity;
    private mapToLedgerEntity;
}
