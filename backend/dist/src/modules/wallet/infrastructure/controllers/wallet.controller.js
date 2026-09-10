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
exports.WalletController = void 0;
const common_1 = require("@nestjs/common");
const wallet_service_1 = require("../../application/services/wallet.service");
const dto_1 = require("../../application/dto");
const jwt_auth_guard_1 = require("../../../auth/infrastructure/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../../auth/infrastructure/decorators/current-user.decorator");
let WalletController = class WalletController {
    constructor(walletService) {
        this.walletService = walletService;
    }
    async getBalance(userId) {
        const data = await this.walletService.getBalance(userId);
        return {
            success: true,
            statusCode: common_1.HttpStatus.OK,
            data,
            meta: { timestamp: new Date().toISOString() },
        };
    }
    async getTransactions(userId, page, limit) {
        const pageNum = page ? parseInt(page, 10) : 1;
        const limitNum = limit ? parseInt(limit, 10) : 20;
        const data = await this.walletService.getTransactions(userId, pageNum, limitNum);
        return {
            success: true,
            statusCode: common_1.HttpStatus.OK,
            data,
            meta: { timestamp: new Date().toISOString() },
        };
    }
    async mockTopUp(userId, dto) {
        const data = await this.walletService.topUp(userId, dto);
        return {
            success: true,
            statusCode: common_1.HttpStatus.OK,
            data,
            meta: { timestamp: new Date().toISOString() },
        };
    }
    async mockCashOut(userId, dto) {
        const data = await this.walletService.cashOut(userId, dto);
        return {
            success: true,
            statusCode: common_1.HttpStatus.OK,
            data,
            meta: { timestamp: new Date().toISOString() },
        };
    }
};
exports.WalletController = WalletController;
__decorate([
    (0, common_1.Get)('balance'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "getBalance", null);
__decorate([
    (0, common_1.Get)('transactions'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "getTransactions", null);
__decorate([
    (0, common_1.Post)('mock/topup'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.TopUpDto]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "mockTopUp", null);
__decorate([
    (0, common_1.Post)('mock/cashout'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CashOutDto]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "mockCashOut", null);
exports.WalletController = WalletController = __decorate([
    (0, common_1.Controller)('api/v1/wallet'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [wallet_service_1.WalletService])
], WalletController);
//# sourceMappingURL=wallet.controller.js.map