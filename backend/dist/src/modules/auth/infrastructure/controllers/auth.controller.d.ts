import { HttpStatus } from '@nestjs/common';
import { AuthService } from '../../application/services/auth.service';
import { RequestOtpDto, VerifyOtpDto, RefreshTokenDto, OAuthLoginDto, LoginDto, RegisterDto } from '../../application/dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): Promise<{
        success: boolean;
        statusCode: HttpStatus;
        data: import("../../application/services/auth.service").AuthResult;
        meta: {
            timestamp: string;
        };
    }>;
    register(dto: RegisterDto): Promise<{
        success: boolean;
        statusCode: HttpStatus;
        data: import("../../application/services/auth.service").AuthResult;
        meta: {
            timestamp: string;
        };
    }>;
    requestOtp(dto: RequestOtpDto): Promise<{
        success: boolean;
        statusCode: HttpStatus;
        data: {
            success: boolean;
            message: string;
            ttlSeconds: number;
        };
        meta: {
            timestamp: string;
        };
    }>;
    verifyOtp(dto: VerifyOtpDto): Promise<{
        success: boolean;
        statusCode: HttpStatus;
        data: import("../../application/services/auth.service").AuthResult;
        meta: {
            timestamp: string;
        };
    }>;
    refreshToken(dto: RefreshTokenDto): Promise<{
        success: boolean;
        statusCode: HttpStatus;
        data: import("../../application/services/auth.service").AuthTokens;
        meta: {
            timestamp: string;
        };
    }>;
    oauthLogin(dto: OAuthLoginDto): Promise<{
        success: boolean;
        statusCode: HttpStatus;
        data: import("../../application/services/auth.service").AuthResult;
        meta: {
            timestamp: string;
        };
    }>;
    bootstrap(): Promise<{
        success: boolean;
        statusCode: HttpStatus;
        data: import("../../application/services/auth.service").AuthResult;
        meta: {
            timestamp: string;
        };
    }>;
}
