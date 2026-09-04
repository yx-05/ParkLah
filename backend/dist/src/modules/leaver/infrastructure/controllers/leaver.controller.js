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
exports.LeaverController = void 0;
const common_1 = require("@nestjs/common");
const leaver_broadcast_service_1 = require("../../application/services/leaver-broadcast.service");
const dto_1 = require("../../application/dto");
const jwt_auth_guard_1 = require("../../../auth/infrastructure/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../../auth/infrastructure/decorators/current-user.decorator");
let LeaverController = class LeaverController {
    constructor(leaverService) {
        this.leaverService = leaverService;
    }
    async broadcastDeparture(userId, dto) {
        const session = await this.leaverService.broadcastDeparture(userId, dto);
        return {
            success: true,
            statusCode: common_1.HttpStatus.OK,
            data: session,
            meta: { timestamp: new Date().toISOString() },
        };
    }
    async syncCountdown(userId, dto) {
        const result = await this.leaverService.syncCountdown(userId, dto);
        return {
            success: true,
            statusCode: common_1.HttpStatus.OK,
            data: result,
            meta: { timestamp: new Date().toISOString() },
        };
    }
    async cancelDeparture(userId, dto) {
        const result = await this.leaverService.cancelDeparture(userId, dto);
        return {
            success: true,
            statusCode: common_1.HttpStatus.OK,
            data: result,
            meta: { timestamp: new Date().toISOString() },
        };
    }
    async getSession(userId) {
        const session = await this.leaverService.getSession(userId);
        return {
            success: true,
            statusCode: common_1.HttpStatus.OK,
            data: session,
            meta: { timestamp: new Date().toISOString() },
        };
    }
};
exports.LeaverController = LeaverController;
__decorate([
    (0, common_1.Post)('broadcast'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.DepartureBroadcastDto]),
    __metadata("design:returntype", Promise)
], LeaverController.prototype, "broadcastDeparture", null);
__decorate([
    (0, common_1.Post)('countdown/sync'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.SyncCountdownDto]),
    __metadata("design:returntype", Promise)
], LeaverController.prototype, "syncCountdown", null);
__decorate([
    (0, common_1.Post)('cancel'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CancelDepartureDto]),
    __metadata("design:returntype", Promise)
], LeaverController.prototype, "cancelDeparture", null);
__decorate([
    (0, common_1.Get)('session'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LeaverController.prototype, "getSession", null);
exports.LeaverController = LeaverController = __decorate([
    (0, common_1.Controller)('api/v1/leaver'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [leaver_broadcast_service_1.LeaverBroadcastService])
], LeaverController);
//# sourceMappingURL=leaver.controller.js.map