import { IVehicleRepositoryPort } from '../../domain/ports/vehicle-repository.port';
import { CreateVehicleDto } from '../dto';
export interface VehicleResponse {
    id: string;
    userId: string;
    makeModel: string;
    color: string;
    plateSuffix: string;
    isDefault: boolean;
    createdAt: Date;
}
export declare class VehicleService {
    private readonly vehicleRepository;
    constructor(vehicleRepository: IVehicleRepositoryPort);
    getUserVehicles(userId: string): Promise<VehicleResponse[]>;
    addVehicle(userId: string, dto: CreateVehicleDto): Promise<VehicleResponse>;
    setDefaultVehicle(userId: string, vehicleId: string): Promise<VehicleResponse>;
    deleteVehicle(userId: string, vehicleId: string): Promise<{
        success: boolean;
    }>;
    private mapToResponse;
}
