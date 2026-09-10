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
var CandidateDiscoveryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CandidateDiscoveryService = void 0;
const common_1 = require("@nestjs/common");
const searcher_spatial_repository_port_1 = require("../../../gatekeeper/domain/ports/searcher-spatial-repository.port");
const user_repository_port_1 = require("../../../auth/domain/ports/user-repository.port");
const pharos_candidate_filter_service_1 = require("../../domain/services/pharos-candidate-filter.service");
const road_routing_port_1 = require("../../domain/ports/road-routing.port");
const ml_match_scoring_port_1 = require("../../domain/ports/ml-match-scoring.port");
let CandidateDiscoveryService = CandidateDiscoveryService_1 = class CandidateDiscoveryService {
    constructor(searcherRepo, userRepo, pharosFilter, roadRouting, mlScoring) {
        this.searcherRepo = searcherRepo;
        this.userRepo = userRepo;
        this.pharosFilter = pharosFilter;
        this.roadRouting = roadRouting;
        this.mlScoring = mlScoring;
        this.logger = new common_1.Logger(CandidateDiscoveryService_1.name);
    }
    async discoverAndRankCandidates(spotCoords, leaverCountdownSeconds, radiusMeters = 1500, context) {
        const nearby = await this.searcherRepo.findNearbyActiveSearchers(spotCoords, radiusMeters);
        if (nearby.length === 0) {
            return [];
        }
        const now = new Date();
        const qualifiedCandidates = [];
        for (const { searcher, distanceMeters } of nearby) {
            const pingStalenessSeconds = Math.max(0, Math.round((now.getTime() - new Date(searcher.lastHeartbeat).getTime()) / 1000));
            const headingDegrees = searcher.headingDegrees ?? 0;
            const speedKmh = searcher.speedKmh ?? 25.0;
            const gpsAccuracyMeters = searcher.gpsAccuracyMeters ?? 8.0;
            const kinematicState = {
                searcherId: searcher.searcherId,
                currentCoords: searcher.currentCoords,
                destCoords: searcher.destCoords,
                headingDegrees,
                speedKmh,
                gpsAccuracyMeters,
                lastHeartbeat: new Date(searcher.lastHeartbeat),
                status: 'ACTIVE_SEARCHING',
            };
            const pruning = this.pharosFilter.evaluateCandidate(kinematicState, spotCoords, now);
            if (!pruning.eligible) {
                this.logger.debug(`Pruned searcher ${searcher.searcherId}: reason = ${pruning.rejectReason}`);
                continue;
            }
            const user = await this.userRepo.findById(searcher.searcherId);
            qualifiedCandidates.push({
                searcherId: searcher.searcherId,
                currentCoords: searcher.currentCoords,
                destCoords: searcher.destCoords,
                distanceMeters,
                speedKmh,
                headingDeg: headingDegrees,
                gpsAccuracyMeters,
                pingStalenessSeconds,
                bearingToSpotDeg: pruning.bearingToSpotDeg ?? 0,
                user,
            });
        }
        if (qualifiedCandidates.length === 0) {
            return [];
        }
        const origins = qualifiedCandidates.map((c) => ({
            searcherId: c.searcherId,
            coords: c.currentCoords,
        }));
        const routeResults = await this.roadRouting.calculateCandidateRoutes(spotCoords, origins);
        const routeMap = new Map(routeResults.map((r) => [r.searcherId, r]));
        const currentHour = now.getHours();
        const currentDow = now.getDay();
        const isRushHour = currentDow < 5 && ((currentHour >= 7 && currentHour <= 9) || (currentHour >= 17 && currentHour <= 19))
            ? 1
            : 0;
        const isWeekend = currentDow === 0 || currentDow === 6 ? 1 : 0;
        const spotTypeEnum = context?.spotTypeEnum ?? 0;
        const hasLandmarkNote = context?.hasLandmarkNote ? 1 : context?.landmarkNote ? 1 : 0;
        const landmarkNoteLength = context?.landmarkNote ? context.landmarkNote.length : 0;
        const featureVectors = qualifiedCandidates.map((candidate) => {
            const route = routeMap.get(candidate.searcherId) || {
                roadDistanceMeters: Math.round(candidate.distanceMeters * 1.35),
                roadEtaSeconds: Math.round((candidate.distanceMeters * 1.35) / 6.11),
            };
            const euclidDist = candidate.distanceMeters;
            const roadDist = route.roadDistanceMeters;
            const detourRatio = Math.round((roadDist / Math.max(euclidDist, 10)) * 1000) / 1000;
            const spotToDestDistance = this.pharosFilter.calculateHaversineDistance(spotCoords, candidate.destCoords);
            const bearingToDest = this.pharosFilter.calculateBearing(candidate.currentCoords, candidate.destCoords);
            const headingDestDiff = this.pharosFilter.calculateAngularDivergence(candidate.headingDeg, bearingToDest);
            const headingBearingDiff = this.pharosFilter.calculateAngularDivergence(candidate.headingDeg, candidate.bearingToSpotDeg);
            const absEtaDiff = Math.abs(route.roadEtaSeconds - leaverCountdownSeconds);
            const signedSlack = route.roadEtaSeconds - leaverCountdownSeconds;
            const reliabilityRating = candidate.user?.reliabilityRating ?? 5.0;
            return {
                searcherId: candidate.searcherId,
                roadDistanceMeters: roadDist,
                euclidDistanceMeters: euclidDist,
                detourRatio,
                spotToDestDistanceMeters: spotToDestDistance,
                roadEtaSeconds: route.roadEtaSeconds,
                leaverCountdownSeconds,
                absEtaCountdownDiff: absEtaDiff,
                signedTimeSlack: signedSlack,
                hourOfDay: currentHour,
                dayOfWeek: currentDow,
                isRushHour,
                isWeekend,
                currentSpeedKmh: candidate.speedKmh,
                headingBearingDiffDeg: headingBearingDiff,
                headingDestDiffDeg: headingDestDiff,
                gpsAccuracyMeters: candidate.gpsAccuracyMeters,
                pingStalenessSeconds: candidate.pingStalenessSeconds,
                driverReliabilityRating: reliabilityRating,
                historicalAcceptanceRate: 0.90,
                historicalCompletionRate: 0.92,
                historicalCancellationRate: 0.04,
                lifetimeMatchesCount: 15,
                spotTypeEnum,
                vehicleSizeCompatibility: 1,
                hasLandmarkNote,
                landmarkNoteLength,
            };
        });
        const scoredCandidates = await this.mlScoring.scoreCandidates(featureVectors);
        return scoredCandidates.map((sc) => {
            const feat = sc.features;
            return {
                searcherId: sc.searcherId,
                distanceMeters: feat.euclidDistanceMeters,
                roadDistanceMeters: feat.roadDistanceMeters,
                roadEtaSeconds: feat.roadEtaSeconds,
                score: sc.successProbability,
                features: feat,
            };
        });
    }
};
exports.CandidateDiscoveryService = CandidateDiscoveryService;
exports.CandidateDiscoveryService = CandidateDiscoveryService = CandidateDiscoveryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(searcher_spatial_repository_port_1.SEARCHER_SPATIAL_REPOSITORY_PORT)),
    __param(1, (0, common_1.Inject)(user_repository_port_1.USER_REPOSITORY_PORT)),
    __param(3, (0, common_1.Inject)(road_routing_port_1.ROAD_ROUTING_PORT)),
    __param(4, (0, common_1.Inject)(ml_match_scoring_port_1.ML_MATCH_SCORING_PORT)),
    __metadata("design:paramtypes", [Object, Object, pharos_candidate_filter_service_1.PharosCandidateFilterService, Object, Object])
], CandidateDiscoveryService);
//# sourceMappingURL=candidate-discovery.service.js.map