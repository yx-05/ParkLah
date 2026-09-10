export declare const PAYMENT_GATEWAY_PORT: unique symbol;
export type PaymentMethod = 'FPX' | 'TNG_EWALLET' | 'DUITNOW';
export interface TopUpIntentResult {
    transactionId: string;
    paymentUrl: string;
    amount: number;
    currency: string;
}
export interface IPaymentGatewayPort {
    initiateTopUp(userId: string, amount: number, method: PaymentMethod): Promise<TopUpIntentResult>;
    processPayout(userId: string, amount: number, bankDetails: Record<string, any>): Promise<{
        payoutId: string;
        status: string;
    }>;
}
