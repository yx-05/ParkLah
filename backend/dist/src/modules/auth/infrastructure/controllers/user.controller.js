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
exports.UserController = void 0;
const common_1 = require("@nestjs/common");
const user_service_1 = require("../../application/services/user.service");
const vehicle_service_1 = require("../../application/services/vehicle.service");
const dto_1 = require("../../application/dto");
const jwt_auth_guard_1 = require("../guards/jwt-auth.guard");
const current_user_decorator_1 = require("../decorators/current-user.decorator");
let UserController = class UserController {
    constructor(userService, vehicleService) {
        this.userService = userService;
        this.vehicleService = vehicleService;
    }
    async getProfile(userId) {
        const profile = await this.userService.getUserProfile(userId);
        return {
            success: true,
            statusCode: common_1.HttpStatus.OK,
            data: profile,
            meta: { timestamp: new Date().toISOString() },
        };
    }
    async getVehicles(userId) {
        const vehicles = await this.vehicleService.getUserVehicles(userId);
        return {
            success: true,
            statusCode: common_1.HttpStatus.OK,
            data: vehicles,
            meta: { timestamp: new Date().toISOString() },
        };
    }
    async addVehicle(userId, dto) {
        const vehicle = await this.vehicleService.addVehicle(userId, dto);
        return {
            success: true,
            statusCode: common_1.HttpStatus.CREATED,
            data: vehicle,
            meta: { timestamp: new Date().toISOString() },
        };
    }
    async setDefaultVehicle(userId, vehicleId) {
        const vehicle = await this.vehicleService.setDefaultVehicle(userId, vehicleId);
        return {
            success: true,
            statusCode: common_1.HttpStatus.OK,
            data: vehicle,
            meta: { timestamp: new Date().toISOString() },
        };
    }
    async deleteVehicle(userId, vehicleId) {
        const result = await this.vehicleService.deleteVehicle(userId, vehicleId);
        return {
            success: true,
            statusCode: common_1.HttpStatus.OK,
            data: result,
            meta: { timestamp: new Date().toISOString() },
        };
    }
};
exports.UserController = UserController;
__decorate([
    (0, common_1.Get)('profile'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Get)('vehicles'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getVehicles", null);
__decorate([
    (0, common_1.Post)('vehicles'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CreateVehicleDto]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "addVehicle", null);
__decorate([
    (0, common_1.Patch)('vehicles/:id/default'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "setDefaultVehicle", null);
__decorate([
    (0, common_1.Delete)('vehicles/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "deleteVehicle", null);
exports.UserController = UserController = __decorate([
    (0, common_1.Controller)('api/v1/user'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [user_service_1.UserService,
        vehicle_service_1.VehicleService])
], UserController);
//# sourceMappingURL=user.controller.js.map