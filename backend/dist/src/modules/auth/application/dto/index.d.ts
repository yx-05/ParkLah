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
export * from './oauth-login.dto';
