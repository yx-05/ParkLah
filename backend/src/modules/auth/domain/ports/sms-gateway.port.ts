export const SMS_GATEWAY_PORT = Symbol('ISmsGatewayPort');

export interface ISmsGatewayPort {
  sendOtp(phoneNumber: string, otpCode: string): Promise<boolean>;
}
