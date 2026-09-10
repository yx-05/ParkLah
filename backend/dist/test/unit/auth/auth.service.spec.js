"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_service_1 = require("../../../src/modules/auth/application/services/auth.service");
const in_memory_user_repository_1 = require("../../../src/modules/auth/infrastructure/adapters/in-memory-user.repository");
const in_memory_otp_cache_adapter_1 = require("../../../src/modules/auth/infrastructure/adapters/in-memory-otp-cache.adapter");
const mock_sms_adapter_1 = require("../../../src/modules/auth/infrastructure/adapters/mock-sms.adapter");
const exceptions_1 = require("../../../src/common/exceptions");
describe('AuthService (Module 2 Unit Tests)', () => {
    let authService;
    let userRepo;
    let otpCache;
    let smsGateway;
    beforeEach(() => {
        userRepo = new in_memory_user_repository_1.InMemoryUserRepository();
        otpCache = new in_memory_otp_cache_adapter_1.InMemoryOtpCacheAdapter();
        smsGateway = new mock_sms_adapter_1.MockSmsGatewayAdapter();
        authService = new auth_service_1.AuthService(userRepo, smsGateway, otpCache);
    });
    describe('requestOtp', () => {
        it('should generate a 6-digit OTP and send via SMS gateway', async () => {
            const phone = '+60123456789';
            const res = await authService.requestOtp({ phoneNumber: phone });
            expect(res.success).toBe(true);
            expect(res.ttlSeconds).toBe(300);
            expect(smsGateway.sentOtps.length).toBe(1);
            expect(smsGateway.sentOtps[0].phoneNumber).toBe(phone);
            expect(smsGateway.sentOtps[0].otpCode).toMatch(/^[0-9]{6}$/);
            const cachedOtp = await otpCache.getOtp(phone);
            expect(cachedOtp).toBe(smsGateway.sentOtps[0].otpCode);
        });
        it('should reject OTP request within 60s rate limit window with RateLimitException (429)', async () => {
            const phone = '+60123456789';
            await authService.requestOtp({ phoneNumber: phone });
            await expect(authService.requestOtp({ phoneNumber: phone })).rejects.toThrow(exceptions_1.RateLimitException);
        });
    });
    describe('verifyOtp', () => {
        it('should verify correct OTP, create new user, and return JWT tokens', async () => {
            const phone = '+60198765432';
            await authService.requestOtp({ phoneNumber: phone });
            const sentOtp = smsGateway.sentOtps[0].otpCode;
            const result = await authService.verifyOtp({ phoneNumber: phone, otp: sentOtp });
            expect(result.tokens).toBeDefined();
            expect(result.tokens.accessToken).toBeDefined();
            expect(result.tokens.refreshToken).toBeDefined();
            expect(result.tokens.expiresIn).toBe(3600);
            expect(result.user.phoneNumber).toBe(phone);
            expect(result.user.reliabilityRating).toBe(5.0);
            const cachedOtp = await otpCache.getOtp(phone);
            expect(cachedOtp).toBeNull();
        });
        it('should throw AuthenticationException (401) on invalid OTP code', async () => {
            const phone = '+60123456789';
            await authService.requestOtp({ phoneNumber: phone });
            await expect(authService.verifyOtp({ phoneNumber: phone, otp: '000000' })).rejects.toThrow(exceptions_1.AuthenticationException);
        });
    });
    describe('oauthLogin', () => {
        it('should create new driver profile on first Google OAuth login and return JWT', async () => {
            const result = await authService.oauthLogin({
                provider: 'GOOGLE',
                providerId: 'google-sub-123456',
                email: 'driver@gmail.com',
                fullName: 'Alex Tan',
                avatarUrl: 'https://lh3.googleusercontent.com/avatar.jpg',
            });
            expect(result.tokens.accessToken).toBeDefined();
            expect(result.tokens.refreshToken).toBeDefined();
            expect(result.user.email).toBe('driver@gmail.com');
            expect(result.user.fullName).toBe('Alex Tan');
            expect(result.user.authProvider).toBe('GOOGLE');
            expect(result.user.reliabilityRating).toBe(5.0);
        });
        it('should recognize and return existing user on subsequent Facebook OAuth logins', async () => {
            await authService.oauthLogin({
                provider: 'FACEBOOK',
                providerId: 'fb-user-999',
                email: 'sarah@facebook.com',
                fullName: 'Sarah Lee',
            });
            const secondLogin = await authService.oauthLogin({
                provider: 'FACEBOOK',
                providerId: 'fb-user-999',
                email: 'sarah@facebook.com',
            });
            expect(secondLogin.user.fullName).toBe('Sarah Lee');
            expect(secondLogin.user.authProvider).toBe('FACEBOOK');
        });
    });
    describe('refreshToken', () => {
        it('should return new token pair when valid refresh token is provided', async () => {
            const phone = '+60123456789';
            await authService.requestOtp({ phoneNumber: phone });
            const sentOtp = smsGateway.sentOtps[0].otpCode;
            const { tokens } = await authService.verifyOtp({ phoneNumber: phone, otp: sentOtp });
            const newTokens = await authService.refreshToken(tokens.refreshToken);
            expect(newTokens.accessToken).toBeDefined();
            expect(newTokens.refreshToken).toBeDefined();
        });
        it('should reject invalid or tampered refresh tokens with AuthenticationException', async () => {
            await expect(authService.refreshToken('invalid.tampered.token')).rejects.toThrow(exceptions_1.AuthenticationException);
        });
    });
    describe('register and login', () => {
        it('should register a new user with email and password, hash password, and return JWT', async () => {
            const reg = await authService.register({
                fullName: 'Test Driver',
                emailOrPhone: 'testdriver@parklah.com',
                password: 'securePassword123',
            });
            expect(reg.tokens.accessToken).toBeDefined();
            expect(reg.user.email).toBe('testdriver@parklah.com');
            expect(reg.user.fullName).toBe('Test Driver');
            expect(reg.user.authProvider).toBe('EMAIL');
        });
        it('should login successfully with registered credentials', async () => {
            await authService.register({
                fullName: 'Login Tester',
                emailOrPhone: 'login@parklah.com',
                password: 'myPassword888',
            });
            const res = await authService.login({
                emailOrPhone: 'login@parklah.com',
                password: 'myPassword888',
            });
            expect(res.tokens.accessToken).toBeDefined();
            expect(res.user.email).toBe('login@parklah.com');
            expect(res.user.fullName).toBe('Login Tester');
        });
        it('should reject login with wrong password', async () => {
            await authService.register({
                fullName: 'Wrong Pass',
                emailOrPhone: 'wrongpass@parklah.com',
                password: 'correctPassword',
            });
            await expect(authService.login({
                emailOrPhone: 'wrongpass@parklah.com',
                password: 'wrongPassword',
            })).rejects.toThrow(exceptions_1.AuthenticationException);
        });
        it('should reject login for non-existent account', async () => {
            await expect(authService.login({
                emailOrPhone: 'nobody@nowhere.com',
                password: 'anyPassword',
            })).rejects.toThrow(exceptions_1.AuthenticationException);
        });
    });
});
//# sourceMappingURL=auth.service.spec.js.map