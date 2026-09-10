export type TransactionType = 'MOCK_TOPUP' | 'MOCK_CASHOUT' | 'GATEWAY_TOPUP' | 'PAYOUT_CASHOUT' | 'SEARCHER_HANDOFF_FEE' | 'LEAVER_HANDOFF_REWARD' | 'PLATFORM_COMMISSION' | 'DISPUTE_REFUND';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REVERSED';
export interface LedgerTransactionProps {
    id?: string;
    walletId: string;
    matchId?: string | null;
    idempotencyKey: string;
    transactionType: TransactionType;
    amount: number;
    balanceAfter: number;
    status?: TransactionStatus;
    metadata?: Record<string, any>;
    createdAt?: Date;
}
export declare class LedgerTransactionEntity {
    readonly id: string;
    readonly walletId: string;
    readonly matchId: string | null;
    readonly idempotencyKey: string;
    readonly transactionType: TransactionType;
    readonly amount: number;
    readonly balanceAfter: number;
    status: TransactionStatus;
    readonly metadata: Record<string, any>;
    readonly createdAt: Date;
    constructor(props: LedgerTransactionProps);
    private generateUuid;
}
