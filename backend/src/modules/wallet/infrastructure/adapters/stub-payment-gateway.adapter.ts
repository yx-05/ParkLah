import { Injectable } from '@nestjs/common';
import { IPaymentGatewayPort, PaymentMethod, TopUpIntentResult } from '../../domain/ports/payment-gateway.port';

@Injectable()
export class StubPaymentGatewayAdapter implements IPaymentGatewayPort {
  async initiateTopUp(userId: string, amount: number, method: PaymentMethod): Promise<TopUpIntentResult> {
    return {
      transactionId: `mock_tx_${Date.now()}`,
      paymentUrl: `https://sandbox.payment.parklah.my/checkout?userId=${userId}&amount=${amount}&method=${method}`,
      amount,
      currency: 'MYR',
    };
  }

  async processPayout(userId: string, amount: number, bankDetails: Record<string, any>): Promise<{ payoutId: string; status: string }> {
    return {
      payoutId: `mock_payout_${Date.now()}`,
      status: 'PROCESSING',
    };
  }
}
