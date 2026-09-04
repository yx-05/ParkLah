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
exports.ProbabilisticSpotController = void 0;
const common_1 = require("@nestjs/common");
const probabilistic_vacancy_service_1 = require("../../application/services/probabilistic-vacancy.service");
const dto_1 = require("../../application/dto");
const jwt_auth_guard_1 = require("../../../auth/infrastructure/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../../auth/infrastructure/decorators/current-user.decorator");
let ProbabilisticSpotController = class ProbabilisticSpotController {
    constructor(vacancyService) {
        this.vacancyService = vacancyService;
    }
    async getCandidates(lat, lng, radius) {
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        const radiusMeters = radius ? parseInt(radius, 10) : 500;
        const data = await this.vacancyService.queryTopCandidateSpots({
            latitude,
            longitude,
            radiusMeters,
        });
        return {
            success: true,
            statusCode: common_1.HttpStatus.OK,
            data,
            meta: { timestamp: new Date().toISOString() },
        };
    }
    async createSpot(userId, dto) {
        dto.leaverId = userId;
        const spot = await this.vacancyService.persistVacatedSpot(dto);
        return {
            success: true,
            statusCode: common_1.HttpStatus.CREATED,
            data: spot,
            meta: { timestamp: new Date().toISOString() },
        };
    }
};
exports.ProbabilisticSpotController = ProbabilisticSpotController;
__decorate([
    (0, common_1.Get)('candidates'),
    __param(0, (0, common_1.Query)('lat')),
    __param(1, (0, common_1.Query)('lng')),
    __param(2, (0, common_1.Query)('radius')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ProbabilisticSpotController.prototype, "getCandidates", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CreateProbabilisticSpotDto]),
    __metadata("design:returntype", Promise)
], ProbabilisticSpotController.prototype, "createSpot", null);
exports.ProbabilisticSpotController = ProbabilisticSpotController = __decorate([
    (0, common_1.Controller)('api/v1/spots'),
    __metadata("design:paramtypes", [probabilistic_vacancy_service_1.ProbabilisticVacancyService])
], ProbabilisticSpotController);
//# sourceMappingURL=probabilistic-spot.controller.js.map