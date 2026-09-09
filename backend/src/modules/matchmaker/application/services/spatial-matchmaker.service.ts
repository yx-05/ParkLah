import { Injectable, Inject, Optional } from '@nestjs/common';
import {
  IMatchRepositoryPort,
  MATCH_REPOSITORY_PORT,
} from '../../domain/ports/match-repository.port';
import {
  IDistributedLockPort,
  DISTRIBUTED_LOCK_PORT,
} from '../../domain/ports/distributed-lock.port';
import { CandidateDiscoveryService } from '../../infrastructure/services/candidate-discovery.service';
import { ProbabilisticVacancyService } from '../../../probabilistic/application/services/probabilistic-vacancy.service';
import { SocketBroadcasterService } from '../../../gateway/application/services/socket-broadcaster.service';
import { MlFeatureLoggerService } from './ml-feature-logger.service';
import { MatchEntity } from '../../domain/entities/match.entity';
import { MatchStatus } from '../../domain/enums/match-status.enum';
import { LatLng } from '../../../gatekeeper/domain/ports/google-maps-routing.port';
import { MatchmakingConflictException, ValidationException } from '../../../../common/exceptions';

export interface LeaverMatchRequest {
  leaverId: string;
  spotCoords: LatLng;
  countdownSeconds: number;
  vehicleSummary?: { makeModel: string; color: string; plateSuffix: string };
  landmarkNote?: string;
  spotTypeEnum?: number;
  excludedSearcherIds?: string[];
}

@Injectable()
export class SpatialMatchmakerService {
  public static readonly MIN_MATCH_PROBABILITY_CUTOFF = 0.40;
  private readonly declinedSearchersBySpot: Map<string, Set<string>> = new Map();

  constructor(
    @Inject(MATCH_REPOSITORY_PORT)
    private readonly matchRepository: IMatchRepositoryPort,
    @Inject(DISTRIBUTED_LOCK_PORT)
    private readonly distributedLock: IDistributedLockPort,
    private readonly candidateDiscovery: CandidateDiscoveryService,
    private readonly probabilisticService: ProbabilisticVacancyService,
    private readonly socketBroadcaster: SocketBroadcasterService,
    @Optional()
    private readonly mlFeatureLogger?: MlFeatureLoggerService,
  ) {}

  async findAndOfferMatch(request: LeaverMatchRequest): Promise<{
    matched: boolean;
    match?: MatchEntity;
    fallbackSpotId?: string;
    predictedProbability?: number;
    dispatchRank?: number;
  }> {
    const candidates = await this.candidateDiscovery.discoverAndRankCandidates(
      request.spotCoords,
      request.countdownSeconds,
      1500,
      {
        landmarkNote: request.landmarkNote,
        spotTypeEnum: request.spotTypeEnum,
      },
    );

    const spotLockKey = `spot:${request.leaverId}:${request.spotCoords.latitude}_${request.spotCoords.longitude}`;
    const declinedSet = this.declinedSearchersBySpot.get(spotLockKey) || new Set();
    const excluded = new Set([
      ...Array.from(declinedSet),
      ...(request.excludedSearcherIds || []),
    ]);

    // Cascading Dispatch: Offer to highest-ranking candidate who passes cutoff
    let rank = 1;
    for (const candidate of candidates) {
      if (excluded.has(candidate.searcherId)) {
        continue;
      }

      if (candidate.score < SpatialMatchmakerService.MIN_MATCH_PROBABILITY_CUTOFF) {
        // All remaining candidates are below safety threshold
        break;
      }

      const lockAcquired = await this.distributedLock.acquireSpotLock(
        spotLockKey,
        candidate.searcherId,
        15000, // 15s handshake lock
      );

      if (lockAcquired) {
        const match = new MatchEntity({
          searcherId: candidate.searcherId,
          leaverId: request.leaverId,
          matchType: 'REAL_TIME_P2P',
          spotLatitude: request.spotCoords.latitude,
          spotLongitude: request.spotCoords.longitude,
          status: MatchStatus.OFFERED,
          handshakeTimeoutSeconds: 15,
        });

        const savedMatch = await this.matchRepository.createMatch(match);

        // Telemetry Logging for Continual Learning Flywheel
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

        // Broadcast 15s match offer to searcher
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

    // Fallback: 0 active candidates or all locked/sub-threshold -> Persist to Probabilistic DB
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

  async acceptMatch(matchId: string, searcherId: string): Promise<MatchEntity> {
    const match = await this.matchRepository.findById(matchId);
    if (!match) {
      throw new ValidationException('Match not found');
    }

    if (match.searcherId !== searcherId) {
      throw new ValidationException('Unauthorized: You are not the offered searcher for this match');
    }

    if (match.status !== MatchStatus.OFFERED) {
      throw new MatchmakingConflictException(`Match is no longer available (current status: ${match.status})`);
    }

    match.accept();
    match.markEnRoute();
    const updated = await this.matchRepository.update(match);

    // Notify both parties
    if (match.leaverId) {
      this.socketBroadcaster.emitMatchConfirmed(searcherId, match.leaverId, {
        matchId: match.id,
        status: MatchStatus.EN_ROUTE,
        spotCoords: { latitude: match.spotLatitude, longitude: match.spotLongitude },
      });
    }

    return updated;
  }

  async declineMatch(matchId: string, searcherId: string): Promise<MatchEntity> {
    const match = await this.matchRepository.findById(matchId);
    if (!match) {
      throw new ValidationException('Match not found');
    }

    if (match.searcherId !== searcherId) {
      throw new ValidationException('Unauthorized: You are not the offered searcher');
    }

    const spotLockKey = `spot:${match.leaverId}:${match.spotLatitude}_${match.spotLongitude}`;
    if (!this.declinedSearchersBySpot.has(spotLockKey)) {
      this.declinedSearchersBySpot.set(spotLockKey, new Set());
    }
    this.declinedSearchersBySpot.get(spotLockKey)!.add(searcherId);

    await this.distributedLock.releaseSpotLock(spotLockKey);

    match.markDeclined();
    const updated = await this.matchRepository.update(match);

    if (this.mlFeatureLogger) {
      this.mlFeatureLogger.recordOutcome(matchId, 0, 'DECLINED');
    }

    return updated;
  }

  async handleHandshakeTimeout(matchId: string): Promise<void> {
    const match = await this.matchRepository.findById(matchId);
    if (match && match.status === MatchStatus.OFFERED) {
      const spotLockKey = `spot:${match.leaverId}:${match.spotLatitude}_${match.spotLongitude}`;
      if (!this.declinedSearchersBySpot.has(spotLockKey)) {
        this.declinedSearchersBySpot.set(spotLockKey, new Set());
      }
      this.declinedSearchersBySpot.get(spotLockKey)!.add(match.searcherId);

      await this.distributedLock.releaseSpotLock(spotLockKey);

      match.markTimeout();
      await this.matchRepository.update(match);

      if (this.mlFeatureLogger) {
        this.mlFeatureLogger.recordOutcome(matchId, 0, 'HANDSHAKE_TIMEOUT');
      }

      // Persist to probabilistic vacancy since live searcher timed out
      if (match.leaverId) {
        await this.probabilisticService.persistVacatedSpot({
          leaverId: match.leaverId,
          latitude: match.spotLatitude,
          longitude: match.spotLongitude,
        });
      }
    }
  }

  async recordParkedSuccess(matchId: string): Promise<void> {
    if (this.mlFeatureLogger) {
      await this.mlFeatureLogger.recordOutcome(matchId, 1, 'PARKED_SUCCESS');
    }
  }

  async recordSpotTakenFailure(matchId: string): Promise<void> {
    if (this.mlFeatureLogger) {
      await this.mlFeatureLogger.recordOutcome(matchId, 0, 'SPOT_TAKEN');
    }
  }

  async getMatchById(matchId: string): Promise<MatchEntity | null> {
    return this.matchRepository.findById(matchId);
  }
}
