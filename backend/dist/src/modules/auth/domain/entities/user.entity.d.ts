export type AuthProvider = 'PHONE' | 'GOOGLE' | 'FACEBOOK' | 'APPLE';
export interface UserProps {
    id?: string;
    phoneNumber?: string | null;
    email?: string | null;
    fullName?: string;
    authProvider?: AuthProvider;
    authProviderId?: string | null;
    avatarUrl?: string | null;
    reliabilityRating?: number;
    totalCompletedMatches?: number;
    totalDisputesCount?: number;
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare class UserEntity {
    readonly id: string;
    phoneNumber: string | null;
    email: string | null;
    fullName: string;
    authProvider: AuthProvider;
    authProviderId: string | null;
    avatarUrl: string | null;
    reliabilityRating: number;
    totalCompletedMatches: number;
    totalDisputesCount: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    constructor(props: UserProps);
    private validatePhoneNumber;
    incrementCompletedMatches(): void;
    recordDispute(): void;
    private generateUuid;
}
