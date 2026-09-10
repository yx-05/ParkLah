import { HttpException, HttpStatus } from '@nestjs/common';

export class ParkLahException extends HttpException {
  public readonly errorCode: string;
  public readonly details?: any;

  constructor(errorCode: string, message: string, statusCode: HttpStatus, details?: any) {
    super({ errorCode, message, statusCode, details }, statusCode);
    this.errorCode = errorCode;
    this.details = details;
  }
}

export class AuthenticationException extends ParkLahException {
  constructor(message = 'Invalid authentication credentials or token expired', details?: any) {
    super('AUTH_UNAUTHORIZED', message, HttpStatus.UNAUTHORIZED, details);
  }
}

export class ValidationException extends ParkLahException {
  constructor(message = 'Input validation failed', details?: any) {
    super('INPUT_VALIDATION_ERROR', message, HttpStatus.BAD_REQUEST, details);
  }
}

export class RateLimitException extends ParkLahException {
  constructor(message = 'Rate limit exceeded. Please wait before requesting another OTP.', details?: any) {
    super('AUTH_RATE_LIMITED', message, HttpStatus.TOO_MANY_REQUESTS, details);
  }
}

export class GatekeeperLockedException extends ParkLahException {
  constructor(message = 'Matchmaking locked: ETA > 10 min or Distance > 3.0km', details?: any) {
    super('GATEKEEPER_LOCKED', message, HttpStatus.FORBIDDEN, details);
  }
}

export class MatchmakingConflictException extends ParkLahException {
  constructor(message = 'Spot has already been reserved or locked by another driver', details?: any) {
    super('MATCH_CONFLICT_ALREADY_RESERVED', message, HttpStatus.CONFLICT, details);
  }
}

export class SpotTakenException extends ParkLahException {
  constructor(message = 'Parking stall occupied by third-party vehicle upon arrival', details?: any) {
    super('SPOT_OCCUPIED_BY_THIRD_PARTY', message, HttpStatus.GONE, details);
  }
}

export class InsufficientWalletBalanceException extends ParkLahException {
  constructor(message = 'Insufficient wallet balance. Minimum RM 0.50 required.', details?: any) {
    super('WALLET_INSUFFICIENT_BALANCE', message, HttpStatus.PAYMENT_REQUIRED, details);
  }
}
