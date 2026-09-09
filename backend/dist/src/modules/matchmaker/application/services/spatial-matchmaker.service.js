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
var SpatialMatchmakerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpatialMatchmakerService = void 0;
const common_1 = require("@nestjs/common");
const match_repository_port_1 = require("../../domain/ports/match-repository.port");
const distributed_lock_port_1 = require("../../domain/ports/distributed-lock.port");
const candidate_discovery_service_1 = require("../../infrastructure/services/candidate-discovery.service");
const probabilistic_vacancy_service_1 = require("../../../probabilistic/application/services/probabilistic-vacancy.service");
const socket_broadcaster_service_1 = require("../../../gateway/application/services/socket-broadcaster.service");
const ml_feature_logger_service_1 = require("./ml-feature-logger.service");
const match_entity_1 = require("../../domain/entities/match.entity");
const match_status_enum_1 = require("../../domain/enums/match-status.enum");
const exceptions_1 = require("../../../../common/exceptions");
let SpatialMatchmakerService = SpatialMatchmakerService_1 = class SpatialMatchmakerService {
    constructor(matchRepository, distributedLock, candidateDiscovery, probabilisticService, socketBroadcaster, mlFeatureLogger) {
        this.matchRepository = matchRepository;
        this.distributedLock = distributedLock;
        this.candidateDiscovery = candidateDiscovery;
        this.probabilisticService = probabilisticService;
        this.socketBroadcaster = socketBroadcaster;
        this.mlFeatureLogger = mlFeatureLogger;
        this.declinedSearchersBySpot = new Map();
    }
    async findAndOfferMatch(request) {
        const candidates = await this.candidateDiscovery.discoverAndRankCandidates(request.spotCoords, request.countdownSeconds, 1500, {
            landmarkNote: request.landmarkNote,
            spotTypeEnum: request.spotTypeEnum,
        });
        const spotLockKey = `spot:${request.leaverId}:${request.spotCoords.latitude}_${request.spotCoords.longitude}`;
        const declinedSet = this.declinedSearchersBySpot.get(spotLockKey) || new Set();
        const excluded = new Set([
            ...Array.from(declinedSet),
            ...(request.excludedSearcherIds || []),
        ]);
        let rank = 1;
        for (const candidate of candidates) {
            if (excluded.has(candidate.searcherId)) {
                continue;
            }
            if (candidate.score < SpatialMatchmakerService_1.MIN_MATCH_PROBABILITY_CUTOFF) {
                break;
            }
            const lockAcquired = await this.distributedLock.acquireSpotLock(spotLockKey, candidate.searcherId, 15000);
            if (lockAcquired) {
                const match = new match_entity_1.MatchEntity({
                    searcherId: candidate.searcherId,
                    leaverId: request.leaverId,
                    matchType: 'REAL_TIME_P2P',
                    spotLatitude: request.spotCoords.latitude,
                    spotLongitude: request.spotCoords.longitude,
                    status: match_status_enum_1.MatchStatus.OFFERED,
                    handshakeTimeoutSeconds: 15,
                });
                const savedMatch = await this.matchRepository.createMatch(match);
                if (this.mlFeatureLogger) {
                    this.mlFeatureLogger.logInferenceSnapshot({
                        matchId: savedMatch.id,
                        searcherId: candidate.searcherId,
                        leaverId: request.leaverId,
                        spotLatitude: request.spotCoords.latitude,
                        spotLongitude: request.spotCoords.longitude,
                        predictedProbability: candidate.score,
                        dispatchRank: rank,
                        modelVersion: 'lightgbm_v1_synthetic',
                        featurePayload: candidate.features,
                    });
                }
                this.socketBroadcaster.emitMatchOffer(candidate.searcherId, {
                    matchId: savedMatch.id,
                    leaverId: request.leaverId,
                    spotCoords: request.spotCoords,
                    countdownSeconds: request.countdownSeconds,
                    vehicleSummary: request.vehicleSummary,
                    landmarkNote: request.landmarkNote,
                    handshakeTimeoutSeconds: 15,
                });
                return {
                    matched: true,
                    match: savedMatch,
                    predictedProbability: candidate.score,
                    dispatchRank: rank,
                };
            }
            rank++;
        }
        const fallbackSpot = await this.probabilisticService.persistVacatedSpot({
            leaverId: request.leaverId,
            latitude: request.spotCoords.latitude,
            longitude: request.spotCoords.longitude,
            landmarkNote: request.landmarkNote,
        });
        return {
            matched: false,
            fallbackSpotId: fallbackSpot.id,
        };
    }
    async acceptMatch(matchId, searcherId) {
        const match = await this.matchRepository.findById(matchId);
        if (!match) {
            throw new exceptions_1.ValidationException('Match not found');
        }
        if (match.searcherId !== searcherId) {
            throw new exceptions_1.ValidationException('Unauthorized: You are not the offered searcher for this match');
        }
        if (match.status !== match_status_enum_1.MatchStatus.OFFERED) {
            throw new exceptions_1.MatchmakingConflictException(`Match is no longer available (current status: ${match.status})`);
        }
        match.accept();
        match.markEnRoute();
        const updated = await this.matchRepository.update(match);
        if (match.leaverId) {
            this.socketBroadcaster.emitMatchConfirmed(searcherId, match.leaverId, {
                matchId: match.id,
                status: match_status_enum_1.MatchStatus.EN_ROUTE,
                spotCoords: { latitude: match.spotLatitude, longitude: match.spotLongitude },
            });
        }
        return updated;
    }
    async declineMatch(matchId, searcherId) {
        const match = await this.matchRepository.findById(matchId);
        if (!match) {
            throw new exceptions_1.ValidationException('Match not found');
        }
        if (match.searcherId !== searcherId) {
            throw new exceptions_1.ValidationException('Unauthorized: You are not the offered searcher');
        }
        const spotLockKey = `spot:${match.leaverId}:${match.spotLatitude}_${match.spotLongitude}`;
        if (!this.declinedSearchersBySpot.has(spotLockKey)) {
            this.declinedSearchersBySpot.set(spotLockKey, new Set());
        }
        this.declinedSearchersBySpot.get(spotLockKey).add(searcherId);
        await this.distributedLock.releaseSpotLock(spotLockKey);
        match.markDeclined();
        const updated = await this.matchRepository.update(match);
        if (this.mlFeatureLogger) {
            this.mlFeatureLogger.recordOutcome(matchId, 0, 'DECLINED');
        }
        return updated;
    }
    async handleHandshakeTimeout(matchId) {
        const match = await this.matchRepository.findById(matchId);
        if (match && match.status === match_status_enum_1.MatchStatus.OFFERED) {
            const spotLockKey = `spot:${match.leaverId}:${match.spotLatitude}_${match.spotLongitude}`;
            if (!this.declinedSearchersBySpot.has(spotLockKey)) {
                this.declinedSearchersBySpot.set(spotLockKey, new Set());
            }
            this.declinedSearchersBySpot.get(spotLockKey).add(match.searcherId);
            await this.distributedLock.releaseSpotLock(spotLockKey);
            match.markTimeout();
            await this.matchRepository.update(match);
            if (this.mlFeatureLogger) {
                this.mlFeatureLogger.recordOutcome(matchId, 0, 'HANDSHAKE_TIMEOUT');
            }
            if (match.leaverId) {
                await this.probabilisticService.persistVacatedSpot({
                    leaverId: match.leaverId,
                    latitude: match.spotLatitude,
                    longitude: match.spotLongitude,
                });
            }
        }
    }
    async recordParkedSuccess(matchId) {
        if (this.mlFeatureLogger) {
            await this.mlFeatureLogger.recordOutcome(matchId, 1, 'PARKED_SUCCESS');
        }
    }
    async recordSpotTakenFailure(matchId) {
        if (this.mlFeatureLogger) {
            await this.mlFeatureLogger.recordOutcome(matchId, 0, 'SPOT_TAKEN');
        }
    }
    async getMatchById(matchId) {
        return this.matchRepository.findById(matchId);
    }
};
exports.SpatialMatchmakerService = SpatialMatchmakerService;
SpatialMatchmakerService.MIN_MATCH_PROBABILITY_CUTOFF = 0.40;
exports.SpatialMatchmakerService = SpatialMatchmakerService = SpatialMatchmakerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(match_repository_port_1.MATCH_REPOSITORY_PORT)),
    __param(1, (0, common_1.Inject)(distributed_lock_port_1.DISTRIBUTED_LOCK_PORT)),
    __param(5, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [Object, Object, candidate_discovery_service_1.CandidateDiscoveryService,
        probabilistic_vacancy_service_1.ProbabilisticVacancyService,
        socket_broadcaster_service_1.SocketBroadcasterService,
        ml_feature_logger_service_1.MlFeatureLoggerService])
], SpatialMatchmakerService);
//# sourceMappingURL=spatial-matchmaker.service.js.map