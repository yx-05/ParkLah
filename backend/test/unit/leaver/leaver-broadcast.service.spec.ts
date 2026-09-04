import { LeaverBroadcastService } from '../../../src/modules/leaver/application/services/leaver-broadcast.service';
import { InMemoryLeaverSpatialRepository } from '../../../src/modules/leaver/infrastructure/adapters/in-memory-leaver-spatial.repository';
import { InMemoryEventPublisherAdapter } from '../../../src/modules/leaver/infrastructure/adapters/in-memory-event-publisher.adapter';
import { InMemoryUserRepository } from '../../../src/modules/auth/infrastructure/adapters/in-memory-user.repository';
import { UserEntity } from '../../../src/modules/auth/domain/entities/user.entity';
import { ValidationException } from '../../../src/common/exceptions';

describe('LeaverBroadcastService (Module 4 Unit Tests)', () => {
  let leaverService: LeaverBroadcastService;
  let spatialRepo: InMemoryLeaverSpatialRepository;
  let eventPublisher: InMemoryEventPublisherAdapter;
  let userRepo: InMemoryUserRepository;

  beforeEach(async () => {
    spatialRepo = new InMemoryLeaverSpatialRepository();
    eventPublisher = new InMemoryEventPublisherAdapter();
    userRepo = new InMemoryUserRepository();
    leaverService = new LeaverBroadcastService(spatialRepo, eventPublisher, userRepo);

    // Create a test leaver user
    await userRepo.create(
      new UserEntity({
        id: 'leaver-user-1',
        phoneNumber: '+60123456789',
        reliabilityRating: 5.0,
      }),
    );
  });

  it('should successfully broadcast departure and publish LeaverBroadcastedEvent', async () => {
    const leaverId = 'leaver-user-1';
    const session = await leaverService.broadcastDeparture(leaverId, {
      coordinates: { latitude: 3.139, longitude: 101.686, accuracy: 10 },
      countdownSeconds: 240, // 4 mins
      landmarkNote: 'Near Exit Gate B',
    });

    expect(session.leaverId).toBe(leaverId);
    expect(session.countdownSeconds).toBe(240);
    expect(session.landmarkNote).toBe('Near Exit Gate B');
    expect(session.isMatched).toBe(false);

    // Verify domain event publication
    expect(eventPublisher.publishedEvents.length).toBe(1);
    expect(eventPublisher.publishedEvents[0].channel).toBe('events:leaver:broadcast');
    expect(eventPublisher.publishedEvents[0].event.leaverId).toBe(leaverId);
    expect(eventPublisher.publishedEvents[0].event.countdownSeconds).toBe(240);
  });

  it('should reject countdowns outside the 180s-300s window with ValidationException', async () => {
    const leaverId = 'leaver-user-1';

    // Too short (120s = 2 min)
    await expect(
      leaverService.broadcastDeparture(leaverId, {
        coordinates: { latitude: 3.139, longitude: 101.686 },
        countdownSeconds: 120,
      }),
    ).rejects.toThrow(ValidationException);

    // Too long (360s = 6 min)
    await expect(
      leaverService.broadcastDeparture(leaverId, {
        coordinates: { latitude: 3.139, longitude: 101.686 },
        countdownSeconds: 360,
      }),
    ).rejects.toThrow(ValidationException);
  });

  it('should allow cancellation without penalty when not matched', async () => {
    const leaverId = 'leaver-user-1';
    await leaverService.broadcastDeparture(leaverId, {
      coordinates: { latitude: 3.139, longitude: 101.686 },
      countdownSeconds: 240,
    });

    const result = await leaverService.cancelDeparture(leaverId, { reason: 'CHANGE_OF_PLANS' });

    expect(result.success).toBe(true);
    expect(result.penaltyApplied).toBe(false);

    const user = await userRepo.findById(leaverId);
    expect(user?.reliabilityRating).toBe(5.0);

    const session = await leaverService.getSession(leaverId);
    expect(session).toBeNull();
  });

  it('should apply -0.10 rating penalty when matched departure is cancelled with < 60s remaining', async () => {
    const leaverId = 'leaver-user-1';
    await leaverService.broadcastDeparture(leaverId, {
      coordinates: { latitude: 3.139, longitude: 101.686 },
      countdownSeconds: 240,
    });

    // Simulate match and countdown expiring down to 45s
    await spatialRepo.markMatched(leaverId, 'searcher-user-99');
    await leaverService.syncCountdown(leaverId, { remainingSeconds: 45 });

    const result = await leaverService.cancelDeparture(leaverId, { reason: 'EMERGENCY_DEPARTURE' });

    expect(result.success).toBe(true);
    expect(result.penaltyApplied).toBe(true);

    const user = await userRepo.findById(leaverId);
    expect(user?.reliabilityRating).toBe(4.90); // 5.00 - 0.10 penalty
  });
});
