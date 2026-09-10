"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryVehicleRepository = void 0;
const common_1 = require("@nestjs/common");
let InMemoryVehicleRepository = class InMemoryVehicleRepository {
    constructor() {
        this.vehicles = new Map();
    }
    async findById(id) {
        return this.vehicles.get(id) || null;
    }
    async findByUserId(userId) {
        return Array.from(this.vehicles.values()).filter((v) => v.userId === userId);
    }
    async create(vehicle) {
        if (vehicle.isDefault) {
            await this.clearDefaults(vehicle.userId);
        }
        this.vehicles.set(vehicle.id, vehicle);
        return vehicle;
    }
    async update(vehicle) {
        if (vehicle.isDefault) {
            await this.clearDefaults(vehicle.userId, vehicle.id);
        }
        this.vehicles.set(vehicle.id, vehicle);
        return vehicle;
    }
    async delete(id) {
        return this.vehicles.delete(id);
    }
    async clearDefaults(userId, excludeVehicleId) {
        for (const v of this.vehicles.values()) {
            if (v.userId === userId && v.id !== excludeVehicleId && v.isDefault) {
                v.setDefault(false);
            }
        }
    }
    clear() {
        this.vehicles.clear();
    }
};
exports.InMemoryVehicleRepository = InMemoryVehicleRepository;
exports.InMemoryVehicleRepository = InMemoryVehicleRepository = __decorate([
    (0, common_1.Injectable)()
], InMemoryVehicleRepository);
//# sourceMappingURL=in-memory-vehicle.repository.js.map