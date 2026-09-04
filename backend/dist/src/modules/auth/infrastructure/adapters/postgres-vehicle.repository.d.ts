import { Pool } from 'pg';
import { IVehicleRepositoryPort } from '../../domain/ports/vehicle-repository.port';
import { UserVehicleEntity } from '../../domain/entities/user-vehicle.entity';
export declare class PostgresVehicleRepository implements IVehicleRepositoryPort {
    private pool;
    constructor(pool?: Pool);
    findById(id: string): Promise<UserVehicleEntity | null>;
    findByUserId(userId: string): Promise<UserVehicleEntity[]>;
    create(vehicle: UserVehicleEntity): Promise<UserVehicleEntity>;
    update(vehicle: UserVehicleEntity): Promise<UserVehicleEntity>;
    delete(id: string): Promise<boolean>;
    clearDefaults(userId: string): Promise<void>;
    private mapToEntity;
}
