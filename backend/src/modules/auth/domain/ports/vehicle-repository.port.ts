import { UserVehicleEntity } from '../entities/user-vehicle.entity';

export const VEHICLE_REPOSITORY_PORT = Symbol('IVehicleRepositoryPort');

export interface IVehicleRepositoryPort {
  findById(id: string): Promise<UserVehicleEntity | null>;
  findByUserId(userId: string): Promise<UserVehicleEntity[]>;
  create(vehicle: UserVehicleEntity): Promise<UserVehicleEntity>;
  update(vehicle: UserVehicleEntity): Promise<UserVehicleEntity>;
  delete(id: string): Promise<boolean>;
  clearDefaults(userId: string): Promise<void>;
}
