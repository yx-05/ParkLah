import { Injectable } from '@nestjs/common';
import { IOtpCachePort } from '../../domain/ports/otp-cache.port';

@Injectable()
export class InMemoryOtpCacheAdapter implements IOtpCachePort {
  private otps = new Map<string, { otp: string; expiresAt: number }>();
  private rateLimits = new Map<string, number>();
  private sessions = new Map<string, { data: any; expiresAt: number }>();

  async storeOtp(phoneNumber: string, otp: string, ttlSeconds: number): Promise<void> {
    this.otps.set(phoneNumber, {
      otp,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async getOtp(phoneNumber: string): Promise<string | null> {
    const entry = this.otps.get(phoneNumber);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.otps.delete(phoneNumber);
      return null;
    }
    return entry.otp;
  }

  async deleteOtp(phoneNumber: string): Promise<void> {
    this.otps.delete(phoneNumber);
  }

  async checkRateLimit(phoneNumber: string, rateLimitSeconds: number): Promise<boolean> {
    const nextAllowed = this.rateLimits.get(phoneNumber);
    const now = Date.now();
    if (nextAllowed && now < nextAllowed) {
      return false; // rate limited
    }
    this.rateLimits.set(phoneNumber, now + rateLimitSeconds * 1000);
    return true; // allowed
  }

  async storeSession(userId: string, sessionData: any, ttlSeconds: number): Promise<void> {
    this.sessions.set(userId, {
      data: sessionData,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async getSession(userId: string): Promise<any | null> {
    const entry = this.sessions.get(userId);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.sessions.delete(userId);
      return null;
    }
    return entry.data;
  }

  async deleteSession(userId: string): Promise<void> {
    this.sessions.delete(userId);
  }

  public clear(): void {
    this.otps.clear();
    this.rateLimits.clear();
    this.sessions.clear();
  }
}
