export declare class RequestOtpDto {
    phoneNumber: string;
}
export declare class VerifyOtpDto {
    phoneNumber: string;
    otp: string;
}
export declare class RefreshTokenDto {
    refreshToken: string;
}
export declare class CreateVehicleDto {
    makeModel: string;
    color: string;
    plateSuffix: string;
    isDefault?: boolean;
}
export declare class UpdateRoleDto {
    role: 'SEARCHER' | 'LEAVER';
}
export declare class LoginDto {
    emailOrPhone: string;
    password: string;
}
export declare class RegisterDto {
    fullName: string;
    emailOrPhone: string;
    password: string;
}
export * from './oauth-login.dto';
