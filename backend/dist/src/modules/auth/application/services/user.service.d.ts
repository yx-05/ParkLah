import { IUserRepositoryPort } from '../../domain/ports/user-repository.port';
import { IVehicleRepositoryPort } from '../../domain/ports/vehicle-repository.port';
export interface UserProfileResponse {
    id: string;
    phoneNumber: string | null;
    email: string | null;
    fullName: string;
    authProvider: string;
    avatarUrl: string | null;
    reliabilityRating: number;
    totalCompletedMatches: number;
    totalDisputesCount: number;
    vehicles: Array<{
        id: string;
        makeModel: string;
        color: string;
        plateSuffix: string;
        isDefault: boolean;
    }>;
}
export declare class UserService {
    private readonly userRepository;
    private readonly vehicleRepository;
    constructor(userRepository: IUserRepositoryPort, vehicleRepository: IVehicleRepositoryPort);
    getUserProfile(userId: string): Promise<UserProfileResponse>;
}
