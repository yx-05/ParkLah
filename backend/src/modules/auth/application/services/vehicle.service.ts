import { Injectable, Inject } from '@nestjs/common';
import { IVehicleRepositoryPort, VEHICLE_REPOSITORY_PORT } from '../../domain/ports/vehicle-repository.port';
import { UserVehicleEntity } from '../../domain/entities/user-vehicle.entity';
import { CreateVehicleDto } from '../dto';
import { ValidationException } from '../../../../common/exceptions';

export interface VehicleResponse {
  id: string;
  userId: string;
  makeModel: string;
  color: string;
  plateSuffix: string;
  isDefault: boolean;
  createdAt: Date;
}

@Injectable()
export class VehicleService {
  constructor(
    @Inject(VEHICLE_REPOSITORY_PORT)
    private readonly vehicleRepository: IVehicleRepositoryPort,
  ) {}

  async getUserVehicles(userId: string): Promise<VehicleResponse[]> {
    const vehicles = await this.vehicleRepository.findByUserId(userId);
    return vehicles.map((v) => this.mapToResponse(v));
  }

  async addVehicle(userId: string, dto: CreateVehicleDto): Promise<VehicleResponse> {
    const existingVehicles = await this.vehicleRepository.findByUserId(userId);
    const isFirstVehicle = existingVehicles.length === 0;

    const vehicle = new UserVehicleEntity({
      userId,
      makeModel: dto.makeModel,
      color: dto.color,
      plateSuffix: dto.plateSuffix,
      isDefault: dto.isDefault !== undefined ? dto.isDefault : isFirstVehicle,
    });

    const saved = await this.vehicleRepository.create(vehicle);
    return this.mapToResponse(saved);
  }

  async setDefaultVehicle(userId: string, vehicleId: string): Promise<VehicleResponse> {
    const vehicle = await this.vehicleRepository.findById(vehicleId);
    if (!vehicle || vehicle.userId !== userId) {
      throw new ValidationException('Vehicle not found or does not belong to user');
    }

    vehicle.setDefault(true);
    const updated = await this.vehicleRepository.update(vehicle);
    return this.mapToResponse(updated);
  }

  async deleteVehicle(userId: string, vehicleId: string): Promise<{ success: boolean }> {
    const vehicle = await this.vehicleRepository.findById(vehicleId);
    if (!vehicle || vehicle.userId !== userId) {
      throw new ValidationException('Vehicle not found or does not belong to user');
    }

    await this.vehicleRepository.delete(vehicleId);
    return { success: true };
  }

  private mapToResponse(entity: UserVehicleEntity): VehicleResponse {
    return {
      id: entity.id,
      userId: entity.userId,
      makeModel: entity.makeModel,
      color: entity.color,
      plateSuffix: entity.plateSuffix,
      isDefault: entity.isDefault,
      createdAt: entity.createdAt,
    };
  }
}
