import { IPaymentGatewayPort, PaymentMethod, TopUpIntentResult } from '../../domain/ports/payment-gateway.port';
export declare class StubPaymentGatewayAdapter implements IPaymentGatewayPort {
    initiateTopUp(userId: string, amount: number, method: PaymentMethod): Promise<TopUpIntentResult>;
    processPayout(userId: string, amount: number, bankDetails: Record<string, any>): Promise<{
        payoutId: string;
        status: string;
    }>;
}
