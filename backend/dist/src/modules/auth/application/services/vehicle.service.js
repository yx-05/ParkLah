"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehicleService = void 0;
const common_1 = require("@nestjs/common");
const vehicle_repository_port_1 = require("../../domain/ports/vehicle-repository.port");
const user_vehicle_entity_1 = require("../../domain/entities/user-vehicle.entity");
const exceptions_1 = require("../../../../common/exceptions");
let VehicleService = class VehicleService {
    constructor(vehicleRepository) {
        this.vehicleRepository = vehicleRepository;
    }
    async getUserVehicles(userId) {
        const vehicles = await this.vehicleRepository.findByUserId(userId);
        return vehicles.map((v) => this.mapToResponse(v));
    }
    async addVehicle(userId, dto) {
        const existingVehicles = await this.vehicleRepository.findByUserId(userId);
        const isFirstVehicle = existingVehicles.length === 0;
        const vehicle = new user_vehicle_entity_1.UserVehicleEntity({
            userId,
            makeModel: dto.makeModel,
            color: dto.color,
            plateSuffix: dto.plateSuffix,
            isDefault: dto.isDefault !== undefined ? dto.isDefault : isFirstVehicle,
        });
        const saved = await this.vehicleRepository.create(vehicle);
        return this.mapToResponse(saved);
    }
    async setDefaultVehicle(userId, vehicleId) {
        const vehicle = await this.vehicleRepository.findById(vehicleId);
        if (!vehicle || vehicle.userId !== userId) {
            throw new exceptions_1.ValidationException('Vehicle not found or does not belong to user');
        }
        vehicle.setDefault(true);
        const updated = await this.vehicleRepository.update(vehicle);
        return this.mapToResponse(updated);
    }
    async deleteVehicle(userId, vehicleId) {
        const vehicle = await this.vehicleRepository.findById(vehicleId);
        if (!vehicle || vehicle.userId !== userId) {
            throw new exceptions_1.ValidationException('Vehicle not found or does not belong to user');
        }
        await this.vehicleRepository.delete(vehicleId);
        return { success: true };
    }
    mapToResponse(entity) {
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
};
exports.VehicleService = VehicleService;
exports.VehicleService = VehicleService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(vehicle_repository_port_1.VEHICLE_REPOSITORY_PORT)),
    __metadata("design:paramtypes", [Object])
], VehicleService);
//# sourceMappingURL=vehicle.service.js.map