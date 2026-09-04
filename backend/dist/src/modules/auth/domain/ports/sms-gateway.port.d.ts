export declare const SMS_GATEWAY_PORT: unique symbol;
export interface ISmsGatewayPort {
    sendOtp(phoneNumber: string, otpCode: string): Promise<boolean>;
}
