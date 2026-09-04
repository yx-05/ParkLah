import { Injectable, Inject } from '@nestjs/common';
import {
  ISearcherSpatialRepositoryPort,
  SEARCHER_SPATIAL_REPOSITORY_PORT,
} from '../../../gatekeeper/domain/ports/searcher-spatial-repository.port';
import {
  IUserRepositoryPort,
  USER_REPOSITORY_PORT,
} from '../../../auth/domain/ports/user-repository.port';
import { MatchScoringEngine, CandidateMetrics, MatchScoreResult } from '../../domain/services/match-scoring.engine';
import { LatLng } from '../../../gatekeeper/domain/ports/google-maps-routing.port';

export interface DiscoveredCandidate {
  searcherId: string;
  distanceMeters: number;
  score: number;
  scoreBreakdown: MatchScoreResult;
}

@Injectable()
export class CandidateDiscoveryService {
  constructor(
    @Inject(SEARCHER_SPATIAL_REPOSITORY_PORT)
    private readonly searcherRepo: ISearcherSpatialRepositoryPort,
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepo: IUserRepositoryPort,
    private readonly scoringEngine: MatchScoringEngine,
  ) {}

  async discoverAndRankCandidates(
    spotCoords: LatLng,
    leaverCountdownSeconds: number,
    radiusMeters = 1000,
  ): Promise<DiscoveredCandidate[]> {
    const nearby = await this.searcherRepo.findNearbyActiveSearchers(spotCoords, radiusMeters);
    if (nearby.length === 0) {
      return [];
    }

    const candidateMetrics: CandidateMetrics[] = [];

    for (const { searcher, distanceMeters } of nearby) {
      const user = await this.userRepo.findById(searcher.searcherId);
      const reliabilityRating = user ? user.reliabilityRating : 5.0;

      // Estimate driving ETA assuming 30 km/h = 8.33 m/s
      const searcherEtaSeconds = Math.round(distanceMeters / 8.33);

      candidateMetrics.push({
        searcherId: searcher.searcherId,
        searcherEtaSeconds,
        leaverCountdownSeconds,
        distanceMeters,
        reliabilityRating,
      });
    }

    const rankedScores = this.scoringEngine.rankCandidates(candidateMetrics);

    return rankedScores.map((scoreResult) => {
      const metric = candidateMetrics.find((m) => m.searcherId === scoreResult.searcherId)!;
      return {
        searcherId: scoreResult.searcherId,
        distanceMeters: metric.distanceMeters,
        score: scoreResult.score,
        scoreBreakdown: scoreResult,
      };
    });
  }
}
