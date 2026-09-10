import { Injectable, Logger } from '@nestjs/common';
import { ISmsGatewayPort } from '../../domain/ports/sms-gateway.port';

@Injectable()
export class MockSmsGatewayAdapter implements ISmsGatewayPort {
  private readonly logger = new Logger(MockSmsGatewayAdapter.name);
  public readonly sentOtps: Array<{ phoneNumber: string; otpCode: string; timestamp: Date }> = [];

  async sendOtp(phoneNumber: string, otpCode: string): Promise<boolean> {
    this.logger.log(`[MOCK SMS] Delivering OTP code [${otpCode}] to ${phoneNumber}`);
    this.sentOtps.push({ phoneNumber, otpCode, timestamp: new Date() });
    return true;
  }
}
