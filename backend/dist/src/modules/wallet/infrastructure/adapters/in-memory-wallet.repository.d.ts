import { IWalletRepositoryPort } from '../../domain/ports/wallet-repository.port';
import { WalletEntity } from '../../domain/entities/wallet.entity';
import { LedgerTransactionEntity } from '../../domain/entities/ledger-transaction.entity';
export declare class InMemoryWalletRepository implements IWalletRepositoryPort {
    private wallets;
    private userToWalletId;
    private ledger;
    private transactions;
    findByUserId(userId: string): Promise<WalletEntity | null>;
    findById(walletId: string): Promise<WalletEntity | null>;
    createWallet(wallet: WalletEntity): Promise<WalletEntity>;
    updateWallet(wallet: WalletEntity): Promise<WalletEntity>;
    recordLedgerEntry(transaction: LedgerTransactionEntity): Promise<LedgerTransactionEntity>;
    getLedgerEntryByIdempotencyKey(key: string): Promise<LedgerTransactionEntity | null>;
    getTransactionHistory(walletId: string, page?: number, limit?: number): Promise<{
        transactions: LedgerTransactionEntity[];
        total: number;
    }>;
    clear(): void;
}
