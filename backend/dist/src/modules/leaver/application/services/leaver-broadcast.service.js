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
exports.LeaverBroadcastService = void 0;
const common_1 = require("@nestjs/common");
const leaver_spatial_repository_port_1 = require("../../domain/ports/leaver-spatial-repository.port");
const event_publisher_port_1 = require("../../domain/ports/event-publisher.port");
const user_repository_port_1 = require("../../../auth/domain/ports/user-repository.port");
const spatial_matchmaker_service_1 = require("../../../matchmaker/application/services/spatial-matchmaker.service");
const events_1 = require("../../domain/events");
const exceptions_1 = require("../../../../common/exceptions");
let LeaverBroadcastService = class LeaverBroadcastService {
    constructor(spatialRepository, eventPublisher, userRepository, spatialMatchmaker) {
        this.spatialRepository = spatialRepository;
        this.eventPublisher = eventPublisher;
        this.userRepository = userRepository;
        this.spatialMatchmaker = spatialMatchmaker;
    }
    async broadcastDeparture(leaverId, dto) {
        if (dto.countdownSeconds < 180 || dto.countdownSeconds > 300) {
            throw new exceptions_1.ValidationException('Departure countdown must be between 180s (3m) and 300s (5m)');
        }
        const now = new Date();
        const expiresAt = new Date(now.getTime() + (dto.countdownSeconds + 60) * 1000);
        const session = {
            leaverId,
            coordinates: {
                latitude: dto.coordinates.latitude,
                longitude: dto.coordinates.longitude,
            },
            countdownSeconds: dto.countdownSeconds,
            remainingSeconds: dto.countdownSeconds,
            vehicleId: dto.vehicleId,
            landmarkNote: dto.landmarkNote,
            isMatched: false,
            broadcastAt: now,
            expiresAt,
        };
        const savedSession = await this.spatialRepository.registerActiveLeaver(session);
        await this.eventPublisher.publish('events:leaver:broadcast', new events_1.LeaverBroadcastedEvent(leaverId, session.coordinates, session.countdownSeconds, undefined, session.landmarkNote, now));
        if (this.spatialMatchmaker) {
            try {
                await this.spatialMatchmaker.findAndOfferMatch({
                    leaverId,
                    spotCoords: session.coordinates,
                    countdownSeconds: session.countdownSeconds,
                    landmarkNote: session.landmarkNote,
                });
            }
            catch (err) {
            }
        }
        return savedSession;
    }
    async syncCountdown(leaverId, dto) {
        await this.spatialRepository.updateCountdown(leaverId, dto.remainingSeconds);
        return { success: true };
    }
    async cancelDeparture(leaverId, dto) {
        const session = await this.spatialRepository.getLeaverSession(leaverId);
        let penaltyApplied = false;
        if (session) {
            if (session.isMatched && session.remainingSeconds < 60) {
                penaltyApplied = true;
                const user = await this.userRepository.findById(leaverId);
                if (user) {
                    user.reliabilityRating = Math.max(0, Math.round((user.reliabilityRating - 0.10) * 100) / 100);
                    await this.userRepository.update(user);
                }
            }
            await this.eventPublisher.publish('events:leaver:cancelled', new events_1.LeaverCancelledEvent(leaverId, dto.reason || 'CHANGE_OF_PLANS', session.remainingSeconds, session.isMatched));
            await this.spatialRepository.removeActiveLeaver(leaverId);
        }
        return {
            success: true,
            penaltyApplied,
            message: penaltyApplied
                ? 'Broadcast cancelled. A minor rating penalty was applied for last-minute cancellation during an active match.'
                : 'Broadcast cancelled successfully with no penalties.',
        };
    }
    async getSession(leaverId) {
        return this.spatialRepository.getLeaverSession(leaverId);
    }
};
exports.LeaverBroadcastService = LeaverBroadcastService;
exports.LeaverBroadcastService = LeaverBroadcastService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(leaver_spatial_repository_port_1.LEAVER_SPATIAL_REPOSITORY_PORT)),
    __param(1, (0, common_1.Inject)(event_publisher_port_1.EVENT_PUBLISHER_PORT)),
    __param(2, (0, common_1.Inject)(user_repository_port_1.USER_REPOSITORY_PORT)),
    __param(3, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [Object, Object, Object, spatial_matchmaker_service_1.SpatialMatchmakerService])
], LeaverBroadcastService);
//# sourceMappingURL=leaver-broadcast.service.js.map