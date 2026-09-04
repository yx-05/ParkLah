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
exports.MatchmakerController = void 0;
const common_1 = require("@nestjs/common");
const spatial_matchmaker_service_1 = require("../../application/services/spatial-matchmaker.service");
const jwt_auth_guard_1 = require("../../../auth/infrastructure/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../../auth/infrastructure/decorators/current-user.decorator");
let MatchmakerController = class MatchmakerController {
    constructor(matchmakerService) {
        this.matchmakerService = matchmakerService;
    }
    async acceptMatch(userId, matchId) {
        const match = await this.matchmakerService.acceptMatch(matchId, userId);
        return {
            success: true,
            statusCode: common_1.HttpStatus.OK,
            data: match,
            meta: { timestamp: new Date().toISOString() },
        };
    }
    async declineMatch(userId, matchId) {
        const match = await this.matchmakerService.declineMatch(matchId, userId);
        return {
            success: true,
            statusCode: common_1.HttpStatus.OK,
            data: match,
            meta: { timestamp: new Date().toISOString() },
        };
    }
    async getMatch(matchId) {
        const match = await this.matchmakerService.getMatchById(matchId);
        return {
            success: true,
            statusCode: common_1.HttpStatus.OK,
            data: match,
            meta: { timestamp: new Date().toISOString() },
        };
    }
};
exports.MatchmakerController = MatchmakerController;
__decorate([
    (0, common_1.Post)(':id/accept'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MatchmakerController.prototype, "acceptMatch", null);
__decorate([
    (0, common_1.Post)(':id/decline'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MatchmakerController.prototype, "declineMatch", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MatchmakerController.prototype, "getMatch", null);
exports.MatchmakerController = MatchmakerController = __decorate([
    (0, common_1.Controller)(['api/v1/matches', 'api/v1/matchmaker']),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [spatial_matchmaker_service_1.SpatialMatchmakerService])
], MatchmakerController);
//# sourceMappingURL=matchmaker.controller.js.map