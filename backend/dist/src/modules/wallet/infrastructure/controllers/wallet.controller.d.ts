import { HttpStatus } from '@nestjs/common';
import { WalletService } from '../../application/services/wallet.service';
import { TopUpDto, CashOutDto } from '../../application/dto';
export declare class WalletController {
    private readonly walletService;
    constructor(walletService: WalletService);
    getBalance(userId: string): Promise<{
        success: boolean;
        statusCode: HttpStatus;
        data: import("../../application/services/wallet.service").WalletBalanceResponse;
        meta: {
            timestamp: string;
        };
    }>;
    getTransactions(userId: string, page?: string, limit?: string): Promise<{
        success: boolean;
        statusCode: HttpStatus;
        data: {
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
        };
        meta: {
            timestamp: string;
        };
    }>;
    mockTopUp(userId: string, dto: TopUpDto): Promise<{
        success: boolean;
        statusCode: HttpStatus;
        data: {
            balance: number;
            formattedBalance: string;
            transaction: {
                id: string;
                idempotencyKey: string;
                amount: number;
                type: import("../../domain/entities/ledger-transaction.entity").TransactionType;
                createdAt: Date;
            };
        };
        meta: {
            timestamp: string;
        };
    }>;
    mockCashOut(userId: string, dto: CashOutDto): Promise<{
        success: boolean;
        statusCode: HttpStatus;
        data: {
            balance: number;
            formattedBalance: string;
            transaction: {
                id: string;
                idempotencyKey: string;
                amount: number;
                type: import("../../domain/entities/ledger-transaction.entity").TransactionType;
                createdAt: Date;
            };
        };
        meta: {
            timestamp: string;
        };
    }>;
}
