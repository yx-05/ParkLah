import { Injectable, Inject } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { IUserRepositoryPort, USER_REPOSITORY_PORT } from '../../domain/ports/user-repository.port';
import { ISmsGatewayPort, SMS_GATEWAY_PORT } from '../../domain/ports/sms-gateway.port';
import { IOtpCachePort, OTP_CACHE_PORT } from '../../domain/ports/otp-cache.port';
import { UserEntity } from '../../domain/entities/user.entity';
import { RequestOtpDto, VerifyOtpDto, OAuthLoginDto } from '../dto';
import { AuthenticationException, RateLimitException } from '../../../../common/exceptions';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResult {
  tokens: AuthTokens;
  user: {
    id: string;
    phoneNumber: string | null;
    email: string | null;
    fullName: string;
    authProvider: string;
    avatarUrl: string | null;
    reliabilityRating: number;
  };
}

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtRefreshSecret: string;

  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: IUserRepositoryPort,
    @Inject(SMS_GATEWAY_PORT)
    private readonly smsGateway: ISmsGatewayPort,
    @Inject(OTP_CACHE_PORT)
    private readonly otpCache: IOtpCachePort,
  ) {
    this.jwtSecret = process.env.JWT_SECRET || 'parklah-development-secret-jwt-key-2026';
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'parklah-refresh-secret-jwt-key-2026';
  }

  async requestOtp(dto: RequestOtpDto): Promise<{ success: boolean; message: string; ttlSeconds: number }> {
    const isAllowed = await this.otpCache.checkRateLimit(dto.phoneNumber, 60);
    if (!isAllowed) {
      throw new RateLimitException('Rate limit exceeded. Please wait 60 seconds before requesting another OTP.');
    }

    const otp = this.generate6DigitOtp();
    const ttlSeconds = 300; // 5 minutes

    await this.otpCache.storeOtp(dto.phoneNumber, otp, ttlSeconds);
    await this.smsGateway.sendOtp(dto.phoneNumber, otp);

    return {
      success: true,
      message: 'OTP sent successfully',
      ttlSeconds,
    };
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<AuthResult> {
    const storedOtp = await this.otpCache.getOtp(dto.phoneNumber);
    if (!storedOtp || storedOtp !== dto.otp) {
      throw new AuthenticationException('Invalid or expired OTP code');
    }

    // Clear used OTP
    await this.otpCache.deleteOtp(dto.phoneNumber);

    // Find or create user
    let user = await this.userRepository.findByPhoneNumber(dto.phoneNumber);
    if (!user) {
      user = new UserEntity({
        phoneNumber: dto.phoneNumber,
        fullName: 'ParkLah Driver',
        authProvider: 'PHONE',
        reliabilityRating: 5.0,
      });
      user = await this.userRepository.create(user);
    }

    const tokens = this.generateTokens(user);

    // Store active session in cache
    await this.otpCache.storeSession(
      user.id,
      {
        userId: user.id,
        phoneNumber: user.phoneNumber,
        issuedAt: Date.now(),
      },
      7 * 24 * 3600, // 7 days
    );

    return {
      tokens,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        email: user.email,
        fullName: user.fullName,
        authProvider: user.authProvider,
        avatarUrl: user.avatarUrl,
        reliabilityRating: user.reliabilityRating,
      },
    };
  }

  async oauthLogin(dto: OAuthLoginDto): Promise<AuthResult> {
    // 1. Check if user exists by provider + providerId
    let user = await this.userRepository.findByProvider(dto.provider, dto.providerId);

    // 2. If not found, check by email if provided
    if (!user && dto.email) {
      user = await this.userRepository.findByEmail(dto.email);
      if (user) {
        user.authProvider = dto.provider;
        user.authProviderId = dto.providerId;
        if (dto.avatarUrl && !user.avatarUrl) user.avatarUrl = dto.avatarUrl;
        await this.userRepository.update(user);
      }
    }

    // 3. Create new user if still not existing
    if (!user) {
      user = new UserEntity({
        email: dto.email || null,
        fullName: dto.fullName || `${dto.provider} Driver`,
        authProvider: dto.provider,
        authProviderId: dto.providerId,
        avatarUrl: dto.avatarUrl || null,
        reliabilityRating: 5.0,
      });
      user = await this.userRepository.create(user);
    }

    const tokens = this.generateTokens(user);

    // 4. Store session
    await this.otpCache.storeSession(
      user.id,
      {
        userId: user.id,
        email: user.email,
        authProvider: user.authProvider,
        issuedAt: Date.now(),
      },
      7 * 24 * 3600,
    );

    return {
      tokens,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        email: user.email,
        fullName: user.fullName,
        authProvider: user.authProvider,
        avatarUrl: user.avatarUrl,
        reliabilityRating: user.reliabilityRating,
      },
    };
  }

  async bootstrapDevSession(): Promise<AuthResult> {
    let user = await this.userRepository.findByEmail('yxho15@gmail.com');
    if (!user) {
      user = await this.userRepository.findById('08221e6d-e5e4-4482-b084-6edc23db5107');
    }
    if (!user) {
      user = new UserEntity({
        id: '08221e6d-e5e4-4482-b084-6edc23db5107',
        email: 'yxho15@gmail.com',
        fullName: 'Yxho',
        authProvider: 'GOOGLE',
        reliabilityRating: 5.0,
      });
      try {
        user = await this.userRepository.create(user);
      } catch {}
    }

    const tokens = this.generateTokens(user);
    await this.otpCache.storeSession(
      user.id,
      {
        userId: user.id,
        email: user.email,
        authProvider: user.authProvider,
        issuedAt: Date.now(),
      },
      7 * 24 * 3600,
    );

    return {
      tokens,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        email: user.email,
        fullName: user.fullName,
        authProvider: user.authProvider,
        avatarUrl: user.avatarUrl,
        reliabilityRating: user.reliabilityRating,
      },
    };
  }

  async refreshToken(refreshTokenString: string): Promise<AuthTokens> {
    try {
      const decoded = jwt.verify(refreshTokenString, this.jwtRefreshSecret) as { userId: string };
      const user = await this.userRepository.findById(decoded.userId);
      if (!user || !user.isActive) {
        throw new AuthenticationException('User account not found or deactivated');
      }

      const activeSession = await this.otpCache.getSession(user.id);
      if (!activeSession) {
        throw new AuthenticationException('Session expired or revoked. Please log in again.');
      }

      return this.generateTokens(user);
    } catch (err) {
      if (err instanceof AuthenticationException) throw err;
      throw new AuthenticationException('Invalid refresh token signature or token expired');
    }
  }

  public generateTokens(user: UserEntity): AuthTokens {
    const payload = {
      sub: user.id,
      userId: user.id,
      phoneNumber: user.phoneNumber,
      email: user.email,
      authProvider: user.authProvider,
    };

    const accessToken = jwt.sign(payload, this.jwtSecret, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ userId: user.id }, this.jwtRefreshSecret, { expiresIn: '7d' });

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600,
    };
  }

  public verifyAccessToken(token: string): { sub: string; userId: string; phoneNumber?: string; email?: string } {
    try {
      return jwt.verify(token, this.jwtSecret) as any;
    } catch (e) {
      throw new AuthenticationException('Invalid or expired access token');
    }
  }

  private generate6DigitOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
