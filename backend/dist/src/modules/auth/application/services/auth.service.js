"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt = require("jsonwebtoken");
const user_repository_port_1 = require("../../domain/ports/user-repository.port");
const sms_gateway_port_1 = require("../../domain/ports/sms-gateway.port");
const otp_cache_port_1 = require("../../domain/ports/otp-cache.port");
const user_entity_1 = require("../../domain/entities/user.entity");
const exceptions_1 = require("../../../../common/exceptions");
let AuthService = class AuthService {
    constructor(userRepository, smsGateway, otpCache) {
        this.userRepository = userRepository;
        this.smsGateway = smsGateway;
        this.otpCache = otpCache;
        this.jwtSecret = process.env.JWT_SECRET || 'parklah-development-secret-jwt-key-2026';
        this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'parklah-refresh-secret-jwt-key-2026';
    }
    async requestOtp(dto) {
        const isAllowed = await this.otpCache.checkRateLimit(dto.phoneNumber, 60);
        if (!isAllowed) {
            throw new exceptions_1.RateLimitException('Rate limit exceeded. Please wait 60 seconds before requesting another OTP.');
        }
        const otp = this.generate6DigitOtp();
        const ttlSeconds = 300;
        await this.otpCache.storeOtp(dto.phoneNumber, otp, ttlSeconds);
        await this.smsGateway.sendOtp(dto.phoneNumber, otp);
        return {
            success: true,
            message: 'OTP sent successfully',
            ttlSeconds,
        };
    }
    async verifyOtp(dto) {
        const storedOtp = await this.otpCache.getOtp(dto.phoneNumber);
        if (!storedOtp || storedOtp !== dto.otp) {
            throw new exceptions_1.AuthenticationException('Invalid or expired OTP code');
        }
        await this.otpCache.deleteOtp(dto.phoneNumber);
        let user = await this.userRepository.findByPhoneNumber(dto.phoneNumber);
        if (!user) {
            user = new user_entity_1.UserEntity({
                phoneNumber: dto.phoneNumber,
                fullName: 'ParkLah Driver',
                authProvider: 'PHONE',
                reliabilityRating: 5.0,
            });
            user = await this.userRepository.create(user);
        }
        const tokens = this.generateTokens(user);
        await this.otpCache.storeSession(user.id, {
            userId: user.id,
            phoneNumber: user.phoneNumber,
            issuedAt: Date.now(),
        }, 7 * 24 * 3600);
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
    async oauthLogin(dto) {
        let user = await this.userRepository.findByProvider(dto.provider, dto.providerId);
        if (!user && dto.email) {
            user = await this.userRepository.findByEmail(dto.email);
            if (user) {
                user.authProvider = dto.provider;
                user.authProviderId = dto.providerId;
                if (dto.avatarUrl && !user.avatarUrl)
                    user.avatarUrl = dto.avatarUrl;
                await this.userRepository.update(user);
            }
        }
        if (!user) {
            user = new user_entity_1.UserEntity({
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
        await this.otpCache.storeSession(user.id, {
            userId: user.id,
            email: user.email,
            authProvider: user.authProvider,
            issuedAt: Date.now(),
        }, 7 * 24 * 3600);
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
    async bootstrapDevSession() {
        let user = await this.userRepository.findByEmail('yxho15@gmail.com');
        if (!user) {
            user = await this.userRepository.findById('08221e6d-e5e4-4482-b084-6edc23db5107');
        }
        if (!user) {
            user = new user_entity_1.UserEntity({
                id: '08221e6d-e5e4-4482-b084-6edc23db5107',
                email: 'yxho15@gmail.com',
                fullName: 'Yxho',
                authProvider: 'GOOGLE',
                reliabilityRating: 5.0,
            });
            try {
                user = await this.userRepository.create(user);
            }
            catch { }
        }
        const tokens = this.generateTokens(user);
        await this.otpCache.storeSession(user.id, {
            userId: user.id,
            email: user.email,
            authProvider: user.authProvider,
            issuedAt: Date.now(),
        }, 7 * 24 * 3600);
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
    async refreshToken(refreshTokenString) {
        try {
            const decoded = jwt.verify(refreshTokenString, this.jwtRefreshSecret);
            const user = await this.userRepository.findById(decoded.userId);
            if (!user || !user.isActive) {
                throw new exceptions_1.AuthenticationException('User account not found or deactivated');
            }
            const activeSession = await this.otpCache.getSession(user.id);
            if (!activeSession) {
                throw new exceptions_1.AuthenticationException('Session expired or revoked. Please log in again.');
            }
            return this.generateTokens(user);
        }
        catch (err) {
            if (err instanceof exceptions_1.AuthenticationException)
                throw err;
            throw new exceptions_1.AuthenticationException('Invalid refresh token signature or token expired');
        }
    }
    generateTokens(user) {
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
    verifyAccessToken(token) {
        try {
            return jwt.verify(token, this.jwtSecret);
        }
        catch (e) {
            throw new exceptions_1.AuthenticationException('Invalid or expired access token');
        }
    }
    generate6DigitOtp() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(user_repository_port_1.USER_REPOSITORY_PORT)),
    __param(1, (0, common_1.Inject)(sms_gateway_port_1.SMS_GATEWAY_PORT)),
    __param(2, (0, common_1.Inject)(otp_cache_port_1.OTP_CACHE_PORT)),
    __metadata("design:paramtypes", [Object, Object, Object])
], AuthService);
//# sourceMappingURL=auth.service.js.map