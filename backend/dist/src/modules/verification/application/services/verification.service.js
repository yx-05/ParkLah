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
exports.VerificationService = void 0;
const common_1 = require("@nestjs/common");
const dispute_repository_port_1 = require("../../domain/ports/dispute-repository.port");
const match_repository_port_1 = require("../../../matchmaker/domain/ports/match-repository.port");
const user_repository_port_1 = require("../../../auth/domain/ports/user-repository.port");
const geofence_engine_1 = require("../../domain/services/geofence.engine");
const wallet_service_1 = require("../../../wallet/application/services/wallet.service");
const probabilistic_vacancy_service_1 = require("../../../probabilistic/application/services/probabilistic-vacancy.service");
const socket_broadcaster_service_1 = require("../../../gateway/application/services/socket-broadcaster.service");
const dispute_report_entity_1 = require("../../domain/entities/dispute-report.entity");
const dispute_type_enum_1 = require("../../domain/enums/dispute-type.enum");
const exceptions_1 = require("../../../../common/exceptions");
let VerificationService = class VerificationService {
    constructor(disputeRepository, matchRepository, userRepository, geofenceEngine, walletService, probabilisticService, socketBroadcaster) {
        this.disputeRepository = disputeRepository;
        this.matchRepository = matchRepository;
        this.userRepository = userRepository;
        this.geofenceEngine = geofenceEngine;
        this.walletService = walletService;
        this.probabilisticService = probabilisticService;
        this.socketBroadcaster = socketBroadcaster;
    }
    async evaluateTelemetry(searcherId, matchId, telemetry) {
        const match = await this.matchRepository.findById(matchId);
        if (!match) {
            throw new exceptions_1.ValidationException('Match not found for telemetry evaluation');
        }
        const spotLoc = { latitude: match.spotLatitude, longitude: match.spotLongitude };
        const result = this.geofenceEngine.evaluateArrivalCondition(telemetry, spotLoc);
        if (result.isArrivalTriggered && match.status === 'EN_ROUTE') {
            match.markArrived();
            await this.matchRepository.update(match);
            this.socketBroadcaster.emitArrivalPrompt(searcherId, matchId, spotLoc);
        }
        return result;
    }
    async confirmParkedSuccess(searcherId, dto) {
        const match = await this.matchRepository.findById(dto.matchId);
        if (!match) {
            throw new exceptions_1.ValidationException('Match not found');
        }
        if (match.searcherId !== searcherId) {
            throw new exceptions_1.ValidationException('Unauthorized: You are not the searcher on this match');
        }
        match.markCompleted();
        await this.matchRepository.update(match);
        let settlement = null;
        if (match.leaverId) {
            settlement = await this.walletService.executeHandoffSettlement(match.searcherId, match.leaverId, match.id);
            const searcherUser = await this.userRepository.findById(match.searcherId);
            if (searcherUser) {
                searcherUser.incrementCompletedMatches();
                await this.userRepository.update(searcherUser);
            }
            const leaverUser = await this.userRepository.findById(match.leaverId);
            if (leaverUser) {
                leaverUser.incrementCompletedMatches();
                await this.userRepository.update(leaverUser);
            }
        }
        return {
            success: true,
            matchId: match.id,
            status: match.status,
            completedAt: match.completedAt,
            settlement,
        };
    }
    async reportSpotTaken(searcherId, dto) {
        const match = await this.matchRepository.findById(dto.matchId);
        if (!match) {
            throw new exceptions_1.ValidationException('Match not found');
        }
        match.markFailedSpotTaken();
        await this.matchRepository.update(match);
        const spotId = dto.spotId || match.probabilisticSpotId;
        if (spotId) {
            await this.probabilisticService.invalidateSpot(spotId, 'OCCUPIED');
        }
        const disputeReport = new dispute_report_entity_1.DisputeReportEntity({
            matchId: match.id,
            reporterUserId: searcherId,
            spotId: spotId || null,
            disputeType: dto.disputeType || dispute_type_enum_1.DisputeType.SPOT_TAKEN_BY_STRANGER,
            description: dto.description || 'Spot taken by third-party stranger upon arrival',
            status: dispute_type_enum_1.DisputeStatus.AUTO_RESOLVED,
            resolvedAt: new Date(),
        });
        const savedDispute = await this.disputeRepository.createReport(disputeReport);
        const fallbackResults = await this.probabilisticService.queryTopCandidateSpots({
            latitude: match.spotLatitude,
            longitude: match.spotLongitude,
            radiusMeters: 500,
        });
        if (fallbackResults.candidates.length > 0) {
            const topFallback = fallbackResults.candidates[0];
            this.socketBroadcaster.emitFallbackSpot(searcherId, {
                originalMatchId: match.id,
                fallbackSpot: topFallback,
                reroutedAt: new Date().toISOString(),
            });
        }
        return {
            success: true,
            matchId: match.id,
            chargeAmount: 0.0,
            disputeReportId: savedDispute.id,
            fallbackCandidates: fallbackResults.candidates,
        };
    }
    async getUserDisputes(userId) {
        return this.disputeRepository.findByUserId(userId);
    }
};
exports.VerificationService = VerificationService;
exports.VerificationService = VerificationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(dispute_repository_port_1.DISPUTE_REPOSITORY_PORT)),
    __param(1, (0, common_1.Inject)(match_repository_port_1.MATCH_REPOSITORY_PORT)),
    __param(2, (0, common_1.Inject)(user_repository_port_1.USER_REPOSITORY_PORT)),
    __metadata("design:paramtypes", [Object, Object, Object, geofence_engine_1.GeofenceEngine,
        wallet_service_1.WalletService,
        probabilistic_vacancy_service_1.ProbabilisticVacancyService,
        socket_broadcaster_service_1.SocketBroadcasterService])
], VerificationService);
//# sourceMappingURL=verification.service.js.map