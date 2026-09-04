import Redis from 'ioredis';
import { IOtpCachePort } from '../../domain/ports/otp-cache.port';
export declare class RedisOtpCacheAdapter implements IOtpCachePort {
    private redis;
    constructor(redisClient?: Redis);
    storeOtp(phoneNumber: string, otp: string, ttlSeconds: number): Promise<void>;
    getOtp(phoneNumber: string): Promise<string | null>;
    deleteOtp(phoneNumber: string): Promise<void>;
    checkRateLimit(phoneNumber: string, rateLimitSeconds: number): Promise<boolean>;
    storeSession(userId: string, sessionData: any, ttlSeconds: number): Promise<void>;
    getSession(userId: string): Promise<any | null>;
    deleteSession(userId: string): Promise<void>;
}
