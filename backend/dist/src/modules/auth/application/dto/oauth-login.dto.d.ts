export declare class OAuthLoginDto {
    provider: 'GOOGLE' | 'FACEBOOK' | 'APPLE';
    providerId: string;
    email?: string;
    fullName?: string;
    avatarUrl?: string;
}
