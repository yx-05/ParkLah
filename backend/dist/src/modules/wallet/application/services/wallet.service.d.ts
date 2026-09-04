import { IWalletRepositoryPort } from '../../domain/ports/wallet-repository.port';
import { SettlementTransactionService, SettlementResult } from '../../domain/services/settlement-transaction.service';
import { MockWalletService } from './mock-wallet.service';
import { TopUpDto, CashOutDto } from '../dto';
export interface WalletBalanceResponse {
    userId: string;
    balance: number;
    formattedBalance: string;
    lockedBalance: number;
    currency: string;
    updatedAt: Date;
}
export declare class WalletService {
    private readonly walletRepository;
    private readonly settlementService;
    private readonly mockWalletService;
    constructor(walletRepository: IWalletRepositoryPort, settlementService: SettlementTransactionService, mockWalletService: MockWalletService);
    getBalance(userId: string): Promise<WalletBalanceResponse>;
    executeHandoffSettlement(searcherId: string, leaverId: string, matchId: string): Promise<SettlementResult>;
    topUp(userId: string, dto: TopUpDto): Promise<{
        balance: number;
        formattedBalance: string;
        transaction: {
            id: string;
            idempotencyKey: string;
            amount: number;
            type: import("../../domain/entities/ledger-transaction.entity").TransactionType;
            createdAt: Date;
        };
    }>;
    cashOut(userId: string, dto: CashOutDto): Promise<{
        balance: number;
        formattedBalance: string;
        transaction: {
            id: string;
            idempotencyKey: string;
            amount: number;
            type: import("../../domain/entities/ledger-transaction.entity").TransactionType;
            createdAt: Date;
        };
    }>;
    getTransactions(userId: string, page?: number, limit?: number): Promise<{
        transactions: {
            id: string;
            matchId: string;
            idempotencyKey: string;
            type: import("../../domain/entities/ledger-transaction.entity").TransactionType;
            amount: number;
            balanceAfter: number;
            status: import("../../domain/entities/ledger-transaction.entity").TransactionStatus;
            createdAt: Date;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
}
