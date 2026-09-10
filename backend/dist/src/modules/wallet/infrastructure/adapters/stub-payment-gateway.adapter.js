"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StubPaymentGatewayAdapter = void 0;
const common_1 = require("@nestjs/common");
let StubPaymentGatewayAdapter = class StubPaymentGatewayAdapter {
    async initiateTopUp(userId, amount, method) {
        return {
            transactionId: `mock_tx_${Date.now()}`,
            paymentUrl: `https://sandbox.payment.parklah.my/checkout?userId=${userId}&amount=${amount}&method=${method}`,
            amount,
            currency: 'MYR',
        };
    }
    async processPayout(userId, amount, bankDetails) {
        return {
            payoutId: `mock_payout_${Date.now()}`,
            status: 'PROCESSING',
        };
    }
};
exports.StubPaymentGatewayAdapter = StubPaymentGatewayAdapter;
exports.StubPaymentGatewayAdapter = StubPaymentGatewayAdapter = __decorate([
    (0, common_1.Injectable)()
], StubPaymentGatewayAdapter);
//# sourceMappingURL=stub-payment-gateway.adapter.js.map