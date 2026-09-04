import { IUserRepositoryPort } from '../../domain/ports/user-repository.port';
import { ISmsGatewayPort } from '../../domain/ports/sms-gateway.port';
import { IOtpCachePort } from '../../domain/ports/otp-cache.port';
import { UserEntity } from '../../domain/entities/user.entity';
import { RequestOtpDto, VerifyOtpDto, OAuthLoginDto } from '../dto';
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
export declare class AuthService {
    private readonly userRepository;
    private readonly smsGateway;
    private readonly otpCache;
    private readonly jwtSecret;
    private readonly jwtRefreshSecret;
    constructor(userRepository: IUserRepositoryPort, smsGateway: ISmsGatewayPort, otpCache: IOtpCachePort);
    requestOtp(dto: RequestOtpDto): Promise<{
        success: boolean;
        message: string;
        ttlSeconds: number;
    }>;
    verifyOtp(dto: VerifyOtpDto): Promise<AuthResult>;
    oauthLogin(dto: OAuthLoginDto): Promise<AuthResult>;
    bootstrapDevSession(): Promise<AuthResult>;
    refreshToken(refreshTokenString: string): Promise<AuthTokens>;
    generateTokens(user: UserEntity): AuthTokens;
    verifyAccessToken(token: string): {
        sub: string;
        userId: string;
        phoneNumber?: string;
        email?: string;
    };
    private generate6DigitOtp;
}
