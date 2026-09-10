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
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const user_repository_port_1 = require("../../domain/ports/user-repository.port");
const vehicle_repository_port_1 = require("../../domain/ports/vehicle-repository.port");
const exceptions_1 = require("../../../../common/exceptions");
let UserService = class UserService {
    constructor(userRepository, vehicleRepository) {
        this.userRepository = userRepository;
        this.vehicleRepository = vehicleRepository;
    }
    async getUserProfile(userId) {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new exceptions_1.ValidationException('User not found');
        }
        const vehicles = await this.vehicleRepository.findByUserId(userId);
        return {
            id: user.id,
            phoneNumber: user.phoneNumber,
            email: user.email,
            fullName: user.fullName,
            authProvider: user.authProvider,
            avatarUrl: user.avatarUrl,
            reliabilityRating: user.reliabilityRating,
            totalCompletedMatches: user.totalCompletedMatches,
            totalDisputesCount: user.totalDisputesCount,
            vehicles: vehicles.map((v) => ({
                id: v.id,
                makeModel: v.makeModel,
                color: v.color,
                plateSuffix: `***${v.plateSuffix}`,
                isDefault: v.isDefault,
            })),
        };
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(user_repository_port_1.USER_REPOSITORY_PORT)),
    __param(1, (0, common_1.Inject)(vehicle_repository_port_1.VEHICLE_REPOSITORY_PORT)),
    __metadata("design:paramtypes", [Object, Object])
], UserService);
//# sourceMappingURL=user.service.js.map