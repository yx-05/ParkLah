import { IVehicleRepositoryPort } from '../../domain/ports/vehicle-repository.port';
import { UserVehicleEntity } from '../../domain/entities/user-vehicle.entity';
export declare class InMemoryVehicleRepository implements IVehicleRepositoryPort {
    private vehicles;
    findById(id: string): Promise<UserVehicleEntity | null>;
    findByUserId(userId: string): Promise<UserVehicleEntity[]>;
    create(vehicle: UserVehicleEntity): Promise<UserVehicleEntity>;
    update(vehicle: UserVehicleEntity): Promise<UserVehicleEntity>;
    delete(id: string): Promise<boolean>;
    clearDefaults(userId: string, excludeVehicleId?: string): Promise<void>;
    clear(): void;
}
