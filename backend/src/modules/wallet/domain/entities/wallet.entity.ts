import { InsufficientWalletBalanceException } from '../../../../common/exceptions';

export interface WalletProps {
  id?: string;
  userId: string;
  balance?: number;
  lockedBalance?: number;
  currency?: string;
  version?: number;
  updatedAt?: Date;
}

export class WalletEntity {
  public readonly id: string;
  public readonly userId: string;
  public balance: number;
  public lockedBalance: number;
  public currency: string;
  public version: number;
  public updatedAt: Date;

  constructor(props: WalletProps) {
    this.id = props.id || this.generateUuid();
    this.userId = props.userId;
    this.balance = props.balance !== undefined ? props.balance : 20.0; // Default RM 20.00 mock balance
    this.lockedBalance = props.lockedBalance !== undefined ? props.lockedBalance : 0.0;
    this.currency = props.currency || 'MYR';
    this.version = props.version || 1;
    this.updatedAt = props.updatedAt || new Date();
  }

  public debit(amount: number): number {
    if (amount <= 0) {
      throw new Error('Debit amount must be positive');
    }
    const roundedAmount = Math.round(amount * 100) / 100;
    if (this.balance < roundedAmount) {
      throw new InsufficientWalletBalanceException(
        `Insufficient balance. Current: RM ${this.balance.toFixed(2)}, Required: RM ${roundedAmount.toFixed(2)}`,
      );
    }
    this.balance = Math.round((this.balance - roundedAmount) * 100) / 100;
    this.version += 1;
    this.updatedAt = new Date();
    return this.balance;
  }

  public credit(amount: number): number {
    if (amount <= 0) {
      throw new Error('Credit amount must be positive');
    }
    const roundedAmount = Math.round(amount * 100) / 100;
    this.balance = Math.round((this.balance + roundedAmount) * 100) / 100;
    this.version += 1;
    this.updatedAt = new Date();
    return this.balance;
  }

  public getFormattedBalance(): string {
    return `RM ${this.balance.toFixed(2)}`;
  }

  private generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
