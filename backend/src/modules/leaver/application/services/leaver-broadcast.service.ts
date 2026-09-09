import { Injectable, Inject, Optional } from '@nestjs/common';
import {
  ILeaverSpatialRepositoryPort,
  LEAVER_SPATIAL_REPOSITORY_PORT,
} from '../../domain/ports/leaver-spatial-repository.port';
import {
  IEventPublisherPort,
  EVENT_PUBLISHER_PORT,
} from '../../domain/ports/event-publisher.port';
import {
  IUserRepositoryPort,
  USER_REPOSITORY_PORT,
} from '../../../auth/domain/ports/user-repository.port';
import { SpatialMatchmakerService } from '../../../matchmaker/application/services/spatial-matchmaker.service';
import {
  DepartureBroadcastDto,
  CancelDepartureDto,
  SyncCountdownDto,
  LeaverSessionData,
} from '../dto';
import { LeaverBroadcastedEvent, LeaverCancelledEvent } from '../../domain/events';
import { ValidationException } from '../../../../common/exceptions';

@Injectable()
export class LeaverBroadcastService {
  constructor(
    @Inject(LEAVER_SPATIAL_REPOSITORY_PORT)
    private readonly spatialRepository: ILeaverSpatialRepositoryPort,
    @Inject(EVENT_PUBLISHER_PORT)
    private readonly eventPublisher: IEventPublisherPort,
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: IUserRepositoryPort,
    @Optional()
    private readonly spatialMatchmaker?: SpatialMatchmakerService,
  ) {}

  async broadcastDeparture(
    leaverId: string,
    dto: DepartureBroadcastDto,
  ): Promise<LeaverSessionData> {
    const isInstant = dto.countdownSeconds === 0;
    const isValidWindow = dto.countdownSeconds >= 180 && dto.countdownSeconds <= 300;

    if (!isInstant && !isValidWindow) {
      throw new ValidationException(
        'Departure countdown must be 0s (Instant broadcast) or between 180s (3m) and 300s (5m)',
      );
    }

    const now = new Date();
    const sessionDurationSeconds = isInstant ? 120 : dto.countdownSeconds + 60;
    const expiresAt = new Date(now.getTime() + sessionDurationSeconds * 1000);

    const session: LeaverSessionData = {
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

    // Publish domain event
    await this.eventPublisher.publish(
      'events:leaver:broadcast',
      new LeaverBroadcastedEvent(
        leaverId,
        session.coordinates,
        session.countdownSeconds,
        undefined,
        session.landmarkNote,
        now,
      ),
    );

    // Immediately trigger real-time spatial matchmaking if available
    if (this.spatialMatchmaker) {
      try {
        await this.spatialMatchmaker.findAndOfferMatch({
          leaverId,
          spotCoords: session.coordinates,
          countdownSeconds: session.countdownSeconds,
          landmarkNote: session.landmarkNote,
        });
      } catch (err: any) {
        // Log warning but don't fail broadcast return
      }
    }

    return savedSession;
  }

  async syncCountdown(leaverId: string, dto: SyncCountdownDto): Promise<{ success: boolean }> {
    await this.spatialRepository.updateCountdown(leaverId, dto.remainingSeconds);
    return { success: true };
  }

  async cancelDeparture(
    leaverId: string,
    dto: CancelDepartureDto,
  ): Promise<{ success: boolean; penaltyApplied: boolean; message: string }> {
    const session = await this.spatialRepository.getLeaverSession(leaverId);
    let penaltyApplied = false;

    if (session) {
      // Check cancellation rules
      // If matched and cancelled with < 60s remaining -> penalty of -0.10 reliability rating
      if (session.isMatched && session.remainingSeconds < 60) {
        penaltyApplied = true;
        const user = await this.userRepository.findById(leaverId);
        if (user) {
          user.reliabilityRating = Math.max(0, Math.round((user.reliabilityRating - 0.10) * 100) / 100);
          await this.userRepository.update(user);
        }
      }

      await this.eventPublisher.publish(
        'events:leaver:cancelled',
        new LeaverCancelledEvent(
          leaverId,
          dto.reason || 'CHANGE_OF_PLANS',
          session.remainingSeconds,
          session.isMatched,
        ),
      );

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

  async getSession(leaverId: string): Promise<LeaverSessionData | null> {
    return this.spatialRepository.getLeaverSession(leaverId);
  }
}
