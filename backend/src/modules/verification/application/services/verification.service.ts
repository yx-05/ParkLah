import { Injectable, Inject } from '@nestjs/common';
import {
  IDisputeRepositoryPort,
  DISPUTE_REPOSITORY_PORT,
} from '../../domain/ports/dispute-repository.port';
import {
  IMatchRepositoryPort,
  MATCH_REPOSITORY_PORT,
} from '../../../matchmaker/domain/ports/match-repository.port';
import {
  IUserRepositoryPort,
  USER_REPOSITORY_PORT,
} from '../../../auth/domain/ports/user-repository.port';
import { GeofenceEngine, DriverTelemetry, GeofenceEvaluationResult } from '../../domain/services/geofence.engine';
import { WalletService } from '../../../wallet/application/services/wallet.service';
import { ProbabilisticVacancyService } from '../../../probabilistic/application/services/probabilistic-vacancy.service';
import { SocketBroadcasterService } from '../../../gateway/application/services/socket-broadcaster.service';
import { DisputeReportEntity } from '../../domain/entities/dispute-report.entity';
import { DisputeType, DisputeStatus } from '../../domain/enums/dispute-type.enum';
import { ConfirmParkedDto, ReportSpotTakenDto } from '../dto';
import { ValidationException } from '../../../../common/exceptions';

@Injectable()
export class VerificationService {
  constructor(
    @Inject(DISPUTE_REPOSITORY_PORT)
    private readonly disputeRepository: IDisputeRepositoryPort,
    @Inject(MATCH_REPOSITORY_PORT)
    private readonly matchRepository: IMatchRepositoryPort,
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: IUserRepositoryPort,
    private readonly geofenceEngine: GeofenceEngine,
    private readonly walletService: WalletService,
    private readonly probabilisticService: ProbabilisticVacancyService,
    private readonly socketBroadcaster: SocketBroadcasterService,
  ) {}

  async evaluateTelemetry(
    searcherId: string,
    matchId: string,
    telemetry: DriverTelemetry,
  ): Promise<GeofenceEvaluationResult> {
    const match = await this.matchRepository.findById(matchId);
    if (!match) {
      throw new ValidationException('Match not found for telemetry evaluation');
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

  async confirmParkedSuccess(searcherId: string, dto: ConfirmParkedDto) {
    const match = await this.matchRepository.findById(dto.matchId);
    if (!match) {
      throw new ValidationException('Match not found');
    }

    if (match.searcherId !== searcherId) {
      throw new ValidationException('Unauthorized: You are not the searcher on this match');
    }

    match.markCompleted();
    await this.matchRepository.update(match);

    let settlement = null;
    if (match.leaverId) {
      // Execute RM 0.50 / RM 0.25 financial split
      settlement = await this.walletService.executeHandoffSettlement(
        match.searcherId,
        match.leaverId,
        match.id,
      );

      // Increment completed matches count for both users
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

  async reportSpotTaken(searcherId: string, dto: ReportSpotTakenDto) {
    const match = await this.matchRepository.findById(dto.matchId);
    if (!match) {
      throw new ValidationException('Match not found');
    }

    // Set match status to FAILED_SPOT_TAKEN (Searcher is charged RM 0.00)
    match.markFailedSpotTaken();
    await this.matchRepository.update(match);

    // Invalidate probabilistic spot if present
    const spotId = dto.spotId || match.probabilisticSpotId;
    if (spotId) {
      await this.probabilisticService.invalidateSpot(spotId, 'OCCUPIED');
    }

    // File auto-resolved dispute report
    const disputeReport = new DisputeReportEntity({
      matchId: match.id,
      reporterUserId: searcherId,
      spotId: spotId || null,
      disputeType: dto.disputeType || DisputeType.SPOT_TAKEN_BY_STRANGER,
      description: dto.description || 'Spot taken by third-party stranger upon arrival',
      status: DisputeStatus.AUTO_RESOLVED,
      resolvedAt: new Date(),
    });
    const savedDispute = await this.disputeRepository.createReport(disputeReport);

    // Dynamic Reroute: Find next best candidate spot within 500m
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

  async getUserDisputes(userId: string): Promise<DisputeReportEntity[]> {
    return this.disputeRepository.findByUserId(userId);
  }
}
