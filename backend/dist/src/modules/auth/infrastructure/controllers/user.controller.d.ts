import { HttpStatus } from '@nestjs/common';
import { UserService } from '../../application/services/user.service';
import { VehicleService } from '../../application/services/vehicle.service';
import { CreateVehicleDto } from '../../application/dto';
export declare class UserController {
    private readonly userService;
    private readonly vehicleService;
    constructor(userService: UserService, vehicleService: VehicleService);
    getProfile(userId: string): Promise<{
        success: boolean;
        statusCode: HttpStatus;
        data: import("../../application/services/user.service").UserProfileResponse;
        meta: {
            timestamp: string;
        };
    }>;
    getVehicles(userId: string): Promise<{
        success: boolean;
        statusCode: HttpStatus;
        data: import("../../application/services/vehicle.service").VehicleResponse[];
        meta: {
            timestamp: string;
        };
    }>;
    addVehicle(userId: string, dto: CreateVehicleDto): Promise<{
        success: boolean;
        statusCode: HttpStatus;
        data: import("../../application/services/vehicle.service").VehicleResponse;
        meta: {
            timestamp: string;
        };
    }>;
    setDefaultVehicle(userId: string, vehicleId: string): Promise<{
        success: boolean;
        statusCode: HttpStatus;
        data: import("../../application/services/vehicle.service").VehicleResponse;
        meta: {
            timestamp: string;
        };
    }>;
    deleteVehicle(userId: string, vehicleId: string): Promise<{
        success: boolean;
        statusCode: HttpStatus;
        data: {
            success: boolean;
        };
        meta: {
            timestamp: string;
        };
    }>;
}
