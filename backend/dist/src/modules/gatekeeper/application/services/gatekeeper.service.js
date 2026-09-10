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
exports.GatekeeperService = void 0;
const common_1 = require("@nestjs/common");
const google_maps_routing_port_1 = require("../../domain/ports/google-maps-routing.port");
const searcher_spatial_repository_port_1 = require("../../domain/ports/searcher-spatial-repository.port");
const gatekeeper_evaluator_service_1 = require("../../domain/services/gatekeeper-evaluator.service");
const exceptions_1 = require("../../../../common/exceptions");
let GatekeeperService = class GatekeeperService {
    constructor(routingPort, spatialRepository, evaluator) {
        this.routingPort = routingPort;
        this.spatialRepository = spatialRepository;
        this.evaluator = evaluator;
    }
    async searchPlaces(dto) {
        const proximity = dto.proximityLat && dto.proximityLng
            ? { latitude: dto.proximityLat, longitude: dto.proximityLng }
            : undefined;
        return this.routingPort.searchPlace(dto.query, proximity);
    }
    async evaluateDestination(dto) {
        const metrics = await this.routingPort.getDistanceAndEta(dto.origin, dto.destination);
        const evaluation = this.evaluator.evaluate(metrics.distanceMeters, metrics.durationSeconds);
        return {
            isUnlocked: evaluation.isUnlocked,
            distanceMeters: evaluation.distanceMeters,
            durationSeconds: evaluation.durationSeconds,
            polyline: metrics.polyline,
            unlockThreshold: '<= 10 min ETA and <= 3.0 km distance',
            reason: evaluation.reason,
        };
    }
    async startMatchmaking(searcherId, dto, currentCoords) {
        const metrics = await this.routingPort.getDistanceAndEta(currentCoords, dto.destCoords);
        const evaluation = this.evaluator.evaluate(metrics.distanceMeters, metrics.durationSeconds);
        if (!evaluation.isUnlocked) {
            throw new exceptions_1.GatekeeperLockedException(evaluation.reason || 'Cannot start matchmaking: Searcher is outside the 3.0km / 10-minute boundary');
        }
        return this.spatialRepository.registerActiveSearcher(searcherId, currentCoords, dto.destCoords, dto.destName, dto.radiusMeters);
    }
    async stopMatchmaking(searcherId) {
        const removed = await this.spatialRepository.removeActiveSearcher(searcherId);
        return { success: removed };
    }
    async updateSearcherLocation(searcherId, coords) {
        await this.spatialRepository.updateSearcherLocation(searcherId, coords);
    }
    async getActiveSearcherSession(searcherId) {
        return this.spatialRepository.getActiveSearcherState(searcherId);
    }
};
exports.GatekeeperService = GatekeeperService;
exports.GatekeeperService = GatekeeperService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(google_maps_routing_port_1.GOOGLE_MAPS_ROUTING_PORT)),
    __param(1, (0, common_1.Inject)(searcher_spatial_repository_port_1.SEARCHER_SPATIAL_REPOSITORY_PORT)),
    __metadata("design:paramtypes", [Object, Object, gatekeeper_evaluator_service_1.GatekeeperEvaluatorService])
], GatekeeperService);
//# sourceMappingURL=gatekeeper.service.js.map