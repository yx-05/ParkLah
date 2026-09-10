import { Injectable, Inject } from '@nestjs/common';
import { IUserRepositoryPort, USER_REPOSITORY_PORT } from '../../domain/ports/user-repository.port';
import { IVehicleRepositoryPort, VEHICLE_REPOSITORY_PORT } from '../../domain/ports/vehicle-repository.port';
import { ValidationException } from '../../../../common/exceptions';

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

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: IUserRepositoryPort,
    @Inject(VEHICLE_REPOSITORY_PORT)
    private readonly vehicleRepository: IVehicleRepositoryPort,
  ) {}

  async getUserProfile(userId: string): Promise<UserProfileResponse> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new ValidationException('User not found');
    }

    const vehicles = await this.vehicleRepository.findByUserId(userId);

    return {
      id: user.id,
      phoneNumber: user.phoneNumber,
      email: user.email,
      fullName: user.fullName,
      authProvider: user.authProvider,
      avatarUrl: user.avatarUrl,
      reliabilityRating: user.reliabilityRating,
      totalCompletedMatches: user.totalCompletedMatches,
      totalDisputesCount: user.totalDisputesCount,
      vehicles: vehicles.map((v) => ({
        id: v.id,
        makeModel: v.makeModel,
        color: v.color,
        plateSuffix: `***${v.plateSuffix}`, // Masked suffix presentation
        isDefault: v.isDefault,
      })),
    };
  }
}
