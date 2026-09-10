"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InsufficientWalletBalanceException = exports.SpotTakenException = exports.MatchmakingConflictException = exports.GatekeeperLockedException = exports.RateLimitException = exports.ValidationException = exports.AuthenticationException = exports.ParkLahException = void 0;
const common_1 = require("@nestjs/common");
class ParkLahException extends common_1.HttpException {
    constructor(errorCode, message, statusCode, details) {
        super({ errorCode, message, statusCode, details }, statusCode);
        this.errorCode = errorCode;
        this.details = details;
    }
}
exports.ParkLahException = ParkLahException;
class AuthenticationException extends ParkLahException {
    constructor(message = 'Invalid authentication credentials or token expired', details) {
        super('AUTH_UNAUTHORIZED', message, common_1.HttpStatus.UNAUTHORIZED, details);
    }
}
exports.AuthenticationException = AuthenticationException;
class ValidationException extends ParkLahException {
    constructor(message = 'Input validation failed', details) {
        super('INPUT_VALIDATION_ERROR', message, common_1.HttpStatus.BAD_REQUEST, details);
    }
}
exports.ValidationException = ValidationException;
class RateLimitException extends ParkLahException {
    constructor(message = 'Rate limit exceeded. Please wait before requesting another OTP.', details) {
        super('AUTH_RATE_LIMITED', message, common_1.HttpStatus.TOO_MANY_REQUESTS, details);
    }
}
exports.RateLimitException = RateLimitException;
class GatekeeperLockedException extends ParkLahException {
    constructor(message = 'Matchmaking locked: ETA > 10 min or Distance > 3.0km', details) {
        super('GATEKEEPER_LOCKED', message, common_1.HttpStatus.FORBIDDEN, details);
    }
}
exports.GatekeeperLockedException = GatekeeperLockedException;
class MatchmakingConflictException extends ParkLahException {
    constructor(message = 'Spot has already been reserved or locked by another driver', details) {
        super('MATCH_CONFLICT_ALREADY_RESERVED', message, common_1.HttpStatus.CONFLICT, details);
    }
}
exports.MatchmakingConflictException = MatchmakingConflictException;
class SpotTakenException extends ParkLahException {
    constructor(message = 'Parking stall occupied by third-party vehicle upon arrival', details) {
        super('SPOT_OCCUPIED_BY_THIRD_PARTY', message, common_1.HttpStatus.GONE, details);
    }
}
exports.SpotTakenException = SpotTakenException;
class InsufficientWalletBalanceException extends ParkLahException {
    constructor(message = 'Insufficient wallet balance. Minimum RM 0.50 required.', details) {
        super('WALLET_INSUFFICIENT_BALANCE', message, common_1.HttpStatus.PAYMENT_REQUIRED, details);
    }
}
exports.InsufficientWalletBalanceException = InsufficientWalletBalanceException;
//# sourceMappingURL=index.js.map