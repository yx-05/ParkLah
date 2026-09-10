import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  ISearcherSpatialRepositoryPort,
  SEARCHER_SPATIAL_REPOSITORY_PORT,
} from '../../../gatekeeper/domain/ports/searcher-spatial-repository.port';
import {
  IUserRepositoryPort,
  USER_REPOSITORY_PORT,
} from '../../../auth/domain/ports/user-repository.port';
import {
  PharosCandidateFilterService,
  SearcherKinematicState,
} from '../../domain/services/pharos-candidate-filter.service';
import {
  IRoadRoutingPort,
  ROAD_ROUTING_PORT,
} from '../../domain/ports/road-routing.port';
import {
  IMlMatchScoringPort,
  ML_MATCH_SCORING_PORT,
  MlCandidateFeatures,
} from '../../domain/ports/ml-match-scoring.port';
import { LatLng } from '../../../gatekeeper/domain/ports/google-maps-routing.port';

export interface DiscoveredCandidate {
  searcherId: string;
  distanceMeters: number;
  roadDistanceMeters: number;
  roadEtaSeconds: number;
  score: number; // Inferred match success probability [0..1]
  features: MlCandidateFeatures;
}

export interface CandidateDiscoveryContext {
  spotCoords: LatLng;
  leaverCountdownSeconds: number;
  spotTypeEnum?: number; // 0 = On-street, 1 = Open carpark, 2 = Multilevel
  hasLandmarkNote?: boolean;
  landmarkNote?: string;
  radiusMeters?: number;
}

@Injectable()
export class CandidateDiscoveryService {
  private readonly logger = new Logger(CandidateDiscoveryService.name);

  constructor(
    @Inject(SEARCHER_SPATIAL_REPOSITORY_PORT)
    private readonly searcherRepo: ISearcherSpatialRepositoryPort,
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepo: IUserRepositoryPort,
    private readonly pharosFilter: PharosCandidateFilterService,
    @Inject(ROAD_ROUTING_PORT)
    private readonly roadRouting: IRoadRoutingPort,
    @Inject(ML_MATCH_SCORING_PORT)
    private readonly mlScoring: IMlMatchScoringPort,
  ) {}

  async discoverAndRankCandidates(
    spotCoords: LatLng,
    leaverCountdownSeconds: number,
    radiusMeters = 1500,
    context?: Partial<CandidateDiscoveryContext>,
  ): Promise<DiscoveredCandidate[]> {
    // 1. Redis / Spatial Geofence Coarse Retrieval
    const nearby = await this.searcherRepo.findNearbyActiveSearchers(spotCoords, radiusMeters);
    if (nearby.length === 0) {
      return [];
    }

    const now = new Date();
    const qualifiedCandidates: Array<{
      searcherId: string;
      currentCoords: LatLng;
      destCoords: LatLng;
      distanceMeters: number;
      speedKmh: number;
      headingDeg: number;
      gpsAccuracyMeters: number;
      pingStalenessSeconds: number;
      bearingToSpotDeg: number;
      user: any;
    }> = [];

    // 2. Stage 1: Pharos-inspired 4-tier filtering (spatial, status, heading, freshness)
    for (const { searcher, distanceMeters } of nearby) {
      const pingStalenessSeconds = Math.max(
        0,
        Math.round((now.getTime() - new Date(searcher.lastHeartbeat).getTime()) / 1000),
      );
      const headingDegrees = searcher.headingDegrees ?? 0;
      const speedKmh = searcher.speedKmh ?? 25.0;
      const gpsAccuracyMeters = searcher.gpsAccuracyMeters ?? 8.0;

      const kinematicState: SearcherKinematicState = {
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
        this.logger.debug(
          `Pruned searcher ${searcher.searcherId}: reason = ${pruning.rejectReason}`,
        );
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

    // 3. Stage 2: Road-Network Routing & ETA Engine (OSRM / Fallback)
    const origins = qualifiedCandidates.map((c) => ({
      searcherId: c.searcherId,
      coords: c.currentCoords,
    }));
    const routeResults = await this.roadRouting.calculateCandidateRoutes(spotCoords, origins);
    const routeMap = new Map(routeResults.map((r) => [r.searcherId, r]));

    // 4. Stage 3: Feature Engineering Pipeline (26 features)
    const currentHour = now.getHours();
    const currentDow = now.getDay();
    const isRushHour =
      currentDow < 5 && ((currentHour >= 7 && currentHour <= 9) || (currentHour >= 17 && currentHour <= 19))
        ? 1
        : 0;
    const isWeekend = currentDow === 0 || currentDow === 6 ? 1 : 0;
    const spotTypeEnum = context?.spotTypeEnum ?? 0;
    const hasLandmarkNote = context?.hasLandmarkNote ? 1 : context?.landmarkNote ? 1 : 0;
    const landmarkNoteLength = context?.landmarkNote ? context.landmarkNote.length : 0;

    const featureVectors: MlCandidateFeatures[] = qualifiedCandidates.map((candidate) => {
      const route = routeMap.get(candidate.searcherId) || {
        roadDistanceMeters: Math.round(candidate.distanceMeters * 1.35),
        roadEtaSeconds: Math.round((candidate.distanceMeters * 1.35) / 6.11),
      };

      const euclidDist = candidate.distanceMeters;
      const roadDist = route.roadDistanceMeters;
      const detourRatio = Math.round((roadDist / Math.max(euclidDist, 10)) * 1000) / 1000;

      const spotToDestDistance = this.pharosFilter.calculateHaversineDistance(
        spotCoords,
        candidate.destCoords,
      );

      const bearingToDest = this.pharosFilter.calculateBearing(
        candidate.currentCoords,
        candidate.destCoords,
      );
      const headingDestDiff = this.pharosFilter.calculateAngularDivergence(
        candidate.headingDeg,
        bearingToDest,
      );

      const headingBearingDiff = this.pharosFilter.calculateAngularDivergence(
        candidate.headingDeg,
        candidate.bearingToSpotDeg,
      );

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
        historicalAcceptanceRate: 0.90, // Default prior for active searchers
        historicalCompletionRate: 0.92,
        historicalCancellationRate: 0.04,
        lifetimeMatchesCount: 15,
        spotTypeEnum,
        vehicleSizeCompatibility: 1,
        hasLandmarkNote,
        landmarkNoteLength,
      };
    });

    // 5. Stage 4: LightGBM Model Scoring & Probabilistic Ranking
    const scoredCandidates = await this.mlScoring.scoreCandidates(featureVectors);

    // 6. Map to DiscoveredCandidate return list
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
}
