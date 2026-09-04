"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const leaver_broadcast_service_1 = require("../../../src/modules/leaver/application/services/leaver-broadcast.service");
const in_memory_leaver_spatial_repository_1 = require("../../../src/modules/leaver/infrastructure/adapters/in-memory-leaver-spatial.repository");
const in_memory_event_publisher_adapter_1 = require("../../../src/modules/leaver/infrastructure/adapters/in-memory-event-publisher.adapter");
const in_memory_user_repository_1 = require("../../../src/modules/auth/infrastructure/adapters/in-memory-user.repository");
const user_entity_1 = require("../../../src/modules/auth/domain/entities/user.entity");
const exceptions_1 = require("../../../src/common/exceptions");
describe('LeaverBroadcastService (Module 4 Unit Tests)', () => {
    let leaverService;
    let spatialRepo;
    let eventPublisher;
    let userRepo;
    beforeEach(async () => {
        spatialRepo = new in_memory_leaver_spatial_repository_1.InMemoryLeaverSpatialRepository();
        eventPublisher = new in_memory_event_publisher_adapter_1.InMemoryEventPublisherAdapter();
        userRepo = new in_memory_user_repository_1.InMemoryUserRepository();
        leaverService = new leaver_broadcast_service_1.LeaverBroadcastService(spatialRepo, eventPublisher, userRepo);
        await userRepo.create(new user_entity_1.UserEntity({
            id: 'leaver-user-1',
            phoneNumber: '+60123456789',
            reliabilityRating: 5.0,
        }));
    });
    it('should successfully broadcast departure and publish LeaverBroadcastedEvent', async () => {
        const leaverId = 'leaver-user-1';
        const session = await leaverService.broadcastDeparture(leaverId, {
            coordinates: { latitude: 3.139, longitude: 101.686, accuracy: 10 },
            countdownSeconds: 240,
            landmarkNote: 'Near Exit Gate B',
        });
        expect(session.leaverId).toBe(leaverId);
        expect(session.countdownSeconds).toBe(240);
        expect(session.landmarkNote).toBe('Near Exit Gate B');
        expect(session.isMatched).toBe(false);
        expect(eventPublisher.publishedEvents.length).toBe(1);
        expect(eventPublisher.publishedEvents[0].channel).toBe('events:leaver:broadcast');
        expect(eventPublisher.publishedEvents[0].event.leaverId).toBe(leaverId);
        expect(eventPublisher.publishedEvents[0].event.countdownSeconds).toBe(240);
    });
    it('should reject countdowns outside the 180s-300s window with ValidationException', async () => {
        const leaverId = 'leaver-user-1';
        await expect(leaverService.broadcastDeparture(leaverId, {
            coordinates: { latitude: 3.139, longitude: 101.686 },
            countdownSeconds: 120,
        })).rejects.toThrow(exceptions_1.ValidationException);
        await expect(leaverService.broadcastDeparture(leaverId, {
            coordinates: { latitude: 3.139, longitude: 101.686 },
            countdownSeconds: 360,
        })).rejects.toThrow(exceptions_1.ValidationException);
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
        await spatialRepo.markMatched(leaverId, 'searcher-user-99');
        await leaverService.syncCountdown(leaverId, { remainingSeconds: 45 });
        const result = await leaverService.cancelDeparture(leaverId, { reason: 'EMERGENCY_DEPARTURE' });
        expect(result.success).toBe(true);
        expect(result.penaltyApplied).toBe(true);
        const user = await userRepo.findById(leaverId);
        expect(user?.reliabilityRating).toBe(4.90);
    });
});
//# sourceMappingURL=leaver-broadcast.service.spec.js.map