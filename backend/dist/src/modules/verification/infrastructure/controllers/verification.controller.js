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
exports.VerificationController = void 0;
const common_1 = require("@nestjs/common");
const verification_service_1 = require("../../application/services/verification.service");
const dto_1 = require("../../application/dto");
const jwt_auth_guard_1 = require("../../../auth/infrastructure/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../../auth/infrastructure/decorators/current-user.decorator");
let VerificationController = class VerificationController {
    constructor(verificationService) {
        this.verificationService = verificationService;
    }
    async confirmParked(userId, dto) {
        const result = await this.verificationService.confirmParkedSuccess(userId, dto);
        return {
            success: true,
            statusCode: common_1.HttpStatus.OK,
            data: result,
            meta: { timestamp: new Date().toISOString() },
        };
    }
    async reportSpotTaken(userId, dto) {
        const result = await this.verificationService.reportSpotTaken(userId, dto);
        return {
            success: true,
            statusCode: common_1.HttpStatus.OK,
            data: result,
            meta: { timestamp: new Date().toISOString() },
        };
    }
    async getDisputes(userId) {
        const disputes = await this.verificationService.getUserDisputes(userId);
        return {
            success: true,
            statusCode: common_1.HttpStatus.OK,
            data: disputes,
            meta: { timestamp: new Date().toISOString() },
        };
    }
};
exports.VerificationController = VerificationController;
__decorate([
    (0, common_1.Post)('confirm'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.ConfirmParkedDto]),
    __metadata("design:returntype", Promise)
], VerificationController.prototype, "confirmParked", null);
__decorate([
    (0, common_1.Post)('spot-taken'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.ReportSpotTakenDto]),
    __metadata("design:returntype", Promise)
], VerificationController.prototype, "reportSpotTaken", null);
__decorate([
    (0, common_1.Get)('disputes'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VerificationController.prototype, "getDisputes", null);
exports.VerificationController = VerificationController = __decorate([
    (0, common_1.Controller)('api/v1/verification'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [verification_service_1.VerificationService])
], VerificationController);
//# sourceMappingURL=verification.controller.js.map