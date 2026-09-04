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
exports.GatekeeperController = void 0;
const common_1 = require("@nestjs/common");
const gatekeeper_service_1 = require("../../application/services/gatekeeper.service");
const dto_1 = require("../../application/dto");
const jwt_auth_guard_1 = require("../../../auth/infrastructure/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../../auth/infrastructure/decorators/current-user.decorator");
let GatekeeperController = class GatekeeperController {
    constructor(gatekeeperService) {
        this.gatekeeperService = gatekeeperService;
    }
    async searchDestination(dto) {
        const results = await this.gatekeeperService.searchPlaces(dto);
        return {
            success: true,
            statusCode: common_1.HttpStatus.OK,
            data: results,
            meta: { timestamp: new Date().toISOString() },
        };
    }
    async evaluateDestination(dto) {
        const evaluation = await this.gatekeeperService.evaluateDestination(dto);
        return {
            success: true,
            statusCode: common_1.HttpStatus.OK,
            data: evaluation,
            meta: { timestamp: new Date().toISOString() },
        };
    }
    async startMatchmaking(userId, dto) {
        const session = await this.gatekeeperService.startMatchmaking(userId, dto, dto.currentCoords || dto.destCoords);
        return {
            success: true,
            statusCode: common_1.HttpStatus.OK,
            data: session,
            meta: { timestamp: new Date().toISOString() },
        };
    }
    async stopMatchmaking(userId) {
        const result = await this.gatekeeperService.stopMatchmaking(userId);
        return {
            success: true,
            statusCode: common_1.HttpStatus.OK,
            data: result,
            meta: { timestamp: new Date().toISOString() },
        };
    }
};
exports.GatekeeperController = GatekeeperController;
__decorate([
    (0, common_1.Post)('destination/search'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.SearchPlacesQueryDto]),
    __metadata("design:returntype", Promise)
], GatekeeperController.prototype, "searchDestination", null);
__decorate([
    (0, common_1.Post)('destination/evaluate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.EvaluateDestinationDto]),
    __metadata("design:returntype", Promise)
], GatekeeperController.prototype, "evaluateDestination", null);
__decorate([
    (0, common_1.Post)('start'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], GatekeeperController.prototype, "startMatchmaking", null);
__decorate([
    (0, common_1.Post)('stop'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GatekeeperController.prototype, "stopMatchmaking", null);
exports.GatekeeperController = GatekeeperController = __decorate([
    (0, common_1.Controller)('api/v1/searcher'),
    __metadata("design:paramtypes", [gatekeeper_service_1.GatekeeperService])
], GatekeeperController);
//# sourceMappingURL=gatekeeper.controller.js.map