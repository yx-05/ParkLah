import { ISmsGatewayPort } from '../../domain/ports/sms-gateway.port';
export declare class MockSmsGatewayAdapter implements ISmsGatewayPort {
    private readonly logger;
    readonly sentOtps: Array<{
        phoneNumber: string;
        otpCode: string;
        timestamp: Date;
    }>;
    sendOtp(phoneNumber: string, otpCode: string): Promise<boolean>;
}
