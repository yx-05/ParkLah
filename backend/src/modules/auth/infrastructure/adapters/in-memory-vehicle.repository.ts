import { Injectable } from '@nestjs/common';
import { IVehicleRepositoryPort } from '../../domain/ports/vehicle-repository.port';
import { UserVehicleEntity } from '../../domain/entities/user-vehicle.entity';

@Injectable()
export class InMemoryVehicleRepository implements IVehicleRepositoryPort {
  private vehicles = new Map<string, UserVehicleEntity>();

  async findById(id: string): Promise<UserVehicleEntity | null> {
    return this.vehicles.get(id) || null;
  }

  async findByUserId(userId: string): Promise<UserVehicleEntity[]> {
    return Array.from(this.vehicles.values()).filter((v) => v.userId === userId);
  }

  async create(vehicle: UserVehicleEntity): Promise<UserVehicleEntity> {
    if (vehicle.isDefault) {
      await this.clearDefaults(vehicle.userId);
    }
    this.vehicles.set(vehicle.id, vehicle);
    return vehicle;
  }

  async update(vehicle: UserVehicleEntity): Promise<UserVehicleEntity> {
    if (vehicle.isDefault) {
      await this.clearDefaults(vehicle.userId, vehicle.id);
    }
    this.vehicles.set(vehicle.id, vehicle);
    return vehicle;
  }

  async delete(id: string): Promise<boolean> {
    return this.vehicles.delete(id);
  }

  async clearDefaults(userId: string, excludeVehicleId?: string): Promise<void> {
    for (const v of this.vehicles.values()) {
      if (v.userId === userId && v.id !== excludeVehicleId && v.isDefault) {
        v.setDefault(false);
      }
    }
  }

  public clear(): void {
    this.vehicles.clear();
  }
}
