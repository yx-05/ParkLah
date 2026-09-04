import { HttpException, HttpStatus } from '@nestjs/common';
export declare class ParkLahException extends HttpException {
    readonly errorCode: string;
    readonly details?: any;
    constructor(errorCode: string, message: string, statusCode: HttpStatus, details?: any);
}
export declare class AuthenticationException extends ParkLahException {
    constructor(message?: string, details?: any);
}
export declare class ValidationException extends ParkLahException {
    constructor(message?: string, details?: any);
}
export declare class RateLimitException extends ParkLahException {
    constructor(message?: string, details?: any);
}
export declare class GatekeeperLockedException extends ParkLahException {
    constructor(message?: string, details?: any);
}
export declare class MatchmakingConflictException extends ParkLahException {
    constructor(message?: string, details?: any);
}
export declare class SpotTakenException extends ParkLahException {
    constructor(message?: string, details?: any);
}
export declare class InsufficientWalletBalanceException extends ParkLahException {
    constructor(message?: string, details?: any);
}
