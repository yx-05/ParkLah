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
exports.ProbabilisticVacancyService = void 0;
const common_1 = require("@nestjs/common");
const probabilistic_spot_repository_port_1 = require("../../domain/ports/probabilistic-spot-repository.port");
const decay_engine_1 = require("../../domain/services/decay.engine");
const probabilistic_spot_entity_1 = require("../../domain/entities/probabilistic-spot.entity");
const spot_status_enum_1 = require("../../domain/enums/spot-status.enum");
let ProbabilisticVacancyService = class ProbabilisticVacancyService {
    constructor(spotRepository, decayEngine) {
        this.spotRepository = spotRepository;
        this.decayEngine = decayEngine;
    }
    async persistVacatedSpot(dto) {
        const spot = new probabilistic_spot_entity_1.ProbabilisticSpotEntity({
            leaverId: dto.leaverId || null,
            latitude: dto.latitude,
            longitude: dto.longitude,
            initialP: 0.950,
            currentP: 0.950,
            areaTrafficMultiplier: dto.areaTrafficMultiplier ?? 1.0,
            landmarkNote: dto.landmarkNote || null,
            status: spot_status_enum_1.SpotStatus.AVAILABLE,
        });
        return this.spotRepository.create(spot);
    }
    async queryTopCandidateSpots(dto) {
        const radius = dto.radiusMeters ?? 500;
        const results = await this.spotRepository.findActiveWithinRadius(dto.latitude, dto.longitude, radius, 3);
        const candidates = results.map(({ spot, distanceMeters }) => {
            const liveP = this.decayEngine.calculateCurrentProbability(spot.vacatedAt, spot.areaTrafficMultiplier);
            spot.applyDecay(liveP);
            return {
                spotId: spot.id,
                latitude: spot.latitude,
                longitude: spot.longitude,
                distanceMeters,
                probabilityScore: spot.currentP,
                probabilityLabel: spot.getProbabilityLabel(),
                landmarkNote: spot.landmarkNote,
                vacatedAt: spot.vacatedAt,
                expiresAt: spot.expiresAt,
            };
        });
        return {
            candidates: candidates.filter((c) => c.probabilityScore >= 0.150),
            totalFound: candidates.length,
        };
    }
    async batchDecayTick() {
        const availableSpots = await this.spotRepository.findAllAvailable();
        const updates = [];
        let expiredCount = 0;
        const now = new Date();
        for (const spot of availableSpots) {
            const liveP = this.decayEngine.calculateCurrentProbability(spot.vacatedAt, spot.areaTrafficMultiplier, now);
            if (liveP <= 0 || liveP < 0.150 || spot.isExpired()) {
                updates.push({ id: spot.id, currentP: 0.0, status: spot_status_enum_1.SpotStatus.EXPIRED });
                expiredCount++;
            }
            else {
                updates.push({ id: spot.id, currentP: liveP });
            }
        }
        if (updates.length > 0) {
            await this.spotRepository.updateBatchProbabilities(updates);
        }
        return {
            updatedCount: updates.length - expiredCount,
            expiredCount,
        };
    }
    async invalidateSpot(spotId, reason) {
        const spot = await this.spotRepository.findById(spotId);
        if (!spot)
            return null;
        if (reason === 'OCCUPIED') {
            spot.markOccupied();
        }
        else {
            spot.markReserved();
        }
        return this.spotRepository.update(spot);
    }
    async expireSpotsBatch() {
        return this.spotRepository.expireSpotsBatch(new Date());
    }
};
exports.ProbabilisticVacancyService = ProbabilisticVacancyService;
exports.ProbabilisticVacancyService = ProbabilisticVacancyService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(probabilistic_spot_repository_port_1.PROBABILISTIC_SPOT_REPOSITORY_PORT)),
    __metadata("design:paramtypes", [Object, decay_engine_1.DecayEngine])
], ProbabilisticVacancyService);
//# sourceMappingURL=probabilistic-vacancy.service.js.map