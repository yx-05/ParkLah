export const OTP_CACHE_PORT = Symbol('IOtpCachePort');

export interface IOtpCachePort {
  storeOtp(phoneNumber: string, otp: string, ttlSeconds: number): Promise<void>;
  getOtp(phoneNumber: string): Promise<string | null>;
  deleteOtp(phoneNumber: string): Promise<void>;
  checkRateLimit(phoneNumber: string, rateLimitSeconds: number): Promise<boolean>;
  storeSession(userId: string, sessionData: any, ttlSeconds: number): Promise<void>;
  getSession(userId: string): Promise<any | null>;
  deleteSession(userId: string): Promise<void>;
}
