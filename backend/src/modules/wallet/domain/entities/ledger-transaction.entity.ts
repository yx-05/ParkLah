export type TransactionType =
  | 'MOCK_TOPUP'
  | 'MOCK_CASHOUT'
  | 'GATEWAY_TOPUP'
  | 'PAYOUT_CASHOUT'
  | 'SEARCHER_HANDOFF_FEE'
  | 'LEAVER_HANDOFF_REWARD'
  | 'PLATFORM_COMMISSION'
  | 'DISPUTE_REFUND';

export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REVERSED';

export interface LedgerTransactionProps {
  id?: string;
  walletId: string;
  matchId?: string | null;
  idempotencyKey: string;
  transactionType: TransactionType;
  amount: number; // Positive for credit, negative for debit
  balanceAfter: number;
  status?: TransactionStatus;
  metadata?: Record<string, any>;
  createdAt?: Date;
}

export class LedgerTransactionEntity {
  public readonly id: string;
  public readonly walletId: string;
  public readonly matchId: string | null;
  public readonly idempotencyKey: string;
  public readonly transactionType: TransactionType;
  public readonly amount: number;
  public readonly balanceAfter: number;
  public status: TransactionStatus;
  public readonly metadata: Record<string, any>;
  public readonly createdAt: Date;

  constructor(props: LedgerTransactionProps) {
    this.id = props.id || this.generateUuid();
    this.walletId = props.walletId;
    this.matchId = props.matchId || null;
    this.idempotencyKey = props.idempotencyKey;
    this.transactionType = props.transactionType;
    this.amount = props.amount;
    this.balanceAfter = props.balanceAfter;
    this.status = props.status || 'COMPLETED';
    this.metadata = props.metadata || {};
    this.createdAt = props.createdAt || new Date();
  }

  private generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
