export interface WalletProps {
    id?: string;
    userId: string;
    balance?: number;
    lockedBalance?: number;
    currency?: string;
    version?: number;
    updatedAt?: Date;
}
export declare class WalletEntity {
    readonly id: string;
    readonly userId: string;
    balance: number;
    lockedBalance: number;
    currency: string;
    version: number;
    updatedAt: Date;
    constructor(props: WalletProps);
    debit(amount: number): number;
    credit(amount: number): number;
    getFormattedBalance(): string;
    private generateUuid;
}
