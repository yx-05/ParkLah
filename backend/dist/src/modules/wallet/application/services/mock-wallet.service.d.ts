import { IWalletRepositoryPort } from '../../domain/ports/wallet-repository.port';
import { WalletEntity } from '../../domain/entities/wallet.entity';
import { LedgerTransactionEntity } from '../../domain/entities/ledger-transaction.entity';
export declare class MockWalletService {
    private readonly walletRepository;
    constructor(walletRepository: IWalletRepositoryPort);
    mockTopUp(userId: string, amount: number): Promise<{
        wallet: WalletEntity;
        transaction: LedgerTransactionEntity;
    }>;
    mockCashOut(userId: string, amount: number): Promise<{
        wallet: WalletEntity;
        transaction: LedgerTransactionEntity;
    }>;
}
