"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var MockSmsGatewayAdapter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockSmsGatewayAdapter = void 0;
const common_1 = require("@nestjs/common");
let MockSmsGatewayAdapter = MockSmsGatewayAdapter_1 = class MockSmsGatewayAdapter {
    constructor() {
        this.logger = new common_1.Logger(MockSmsGatewayAdapter_1.name);
        this.sentOtps = [];
    }
    async sendOtp(phoneNumber, otpCode) {
        this.logger.log(`[MOCK SMS] Delivering OTP code [${otpCode}] to ${phoneNumber}`);
        this.sentOtps.push({ phoneNumber, otpCode, timestamp: new Date() });
        return true;
    }
};
exports.MockSmsGatewayAdapter = MockSmsGatewayAdapter;
exports.MockSmsGatewayAdapter = MockSmsGatewayAdapter = MockSmsGatewayAdapter_1 = __decorate([
    (0, common_1.Injectable)()
], MockSmsGatewayAdapter);
//# sourceMappingURL=mock-sms.adapter.js.map