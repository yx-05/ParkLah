import { Injectable, Inject } from '@nestjs/common';
import {
  IGoogleMapsRoutingPort,
  GOOGLE_MAPS_ROUTING_PORT,
  LatLng,
} from '../../domain/ports/google-maps-routing.port';
import {
  ISearcherSpatialRepositoryPort,
  SEARCHER_SPATIAL_REPOSITORY_PORT,
  ActiveSearcherSession,
} from '../../domain/ports/searcher-spatial-repository.port';
import { GatekeeperEvaluatorService } from '../../domain/services/gatekeeper-evaluator.service';
import {
  EvaluateDestinationDto,
  StartSearchDto,
  SearchPlacesQueryDto,
  GatekeeperEvaluationResult,
} from '../dto';
import { GatekeeperLockedException } from '../../../../common/exceptions';

@Injectable()
export class GatekeeperService {
  constructor(
    @Inject(GOOGLE_MAPS_ROUTING_PORT)
    private readonly routingPort: IGoogleMapsRoutingPort,
    @Inject(SEARCHER_SPATIAL_REPOSITORY_PORT)
    private readonly spatialRepository: ISearcherSpatialRepositoryPort,
    private readonly evaluator: GatekeeperEvaluatorService,
  ) {}

  async searchPlaces(dto: SearchPlacesQueryDto) {
    const proximity =
      dto.proximityLat && dto.proximityLng
        ? { latitude: dto.proximityLat, longitude: dto.proximityLng }
        : undefined;
    return this.routingPort.searchPlace(dto.query, proximity);
  }

  async evaluateDestination(dto: EvaluateDestinationDto): Promise<GatekeeperEvaluationResult> {
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

  async startMatchmaking(
    searcherId: string,
    dto: StartSearchDto,
    currentCoords: LatLng,
  ): Promise<ActiveSearcherSession> {
    // Evaluate if Searcher is within the gatekeeper boundary
    const metrics = await this.routingPort.getDistanceAndEta(currentCoords, dto.destCoords);
    const evaluation = this.evaluator.evaluate(metrics.distanceMeters, metrics.durationSeconds);

    if (!evaluation.isUnlocked) {
      throw new GatekeeperLockedException(
        evaluation.reason || 'Cannot start matchmaking: Searcher is outside the 3.0km / 10-minute boundary',
      );
    }

    return this.spatialRepository.registerActiveSearcher(
      searcherId,
      currentCoords,
      dto.destCoords,
      dto.destName,
      dto.radiusMeters,
    );
  }

  async stopMatchmaking(searcherId: string): Promise<{ success: boolean }> {
    const removed = await this.spatialRepository.removeActiveSearcher(searcherId);
    return { success: removed };
  }

  async updateSearcherLocation(searcherId: string, coords: LatLng): Promise<void> {
    await this.spatialRepository.updateSearcherLocation(searcherId, coords);
  }

  async getActiveSearcherSession(searcherId: string): Promise<ActiveSearcherSession | null> {
    return this.spatialRepository.getActiveSearcherState(searcherId);
  }
}
