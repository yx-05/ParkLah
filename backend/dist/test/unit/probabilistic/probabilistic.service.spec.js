"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const probabilistic_vacancy_service_1 = require("../../../src/modules/probabilistic/application/services/probabilistic-vacancy.service");
const decay_engine_1 = require("../../../src/modules/probabilistic/domain/services/decay.engine");
const in_memory_probabilistic_spot_repository_1 = require("../../../src/modules/probabilistic/infrastructure/adapters/in-memory-probabilistic-spot.repository");
const spot_status_enum_1 = require("../../../src/modules/probabilistic/domain/enums/spot-status.enum");
describe('ProbabilisticVacancyService (Module 6 Unit Tests)', () => {
    let service;
    let repo;
    let decayEngine;
    beforeEach(() => {
        repo = new in_memory_probabilistic_spot_repository_1.InMemoryProbabilisticSpotRepository();
        decayEngine = new decay_engine_1.DecayEngine();
        service = new probabilistic_vacancy_service_1.ProbabilisticVacancyService(repo, decayEngine);
    });
    it('should persist a vacated spot with initial P = 0.950 and 15 min expiration', async () => {
        const spot = await service.persistVacatedSpot({
            latitude: 3.1390,
            longitude: 101.6869,
            landmarkNote: 'Near Main Lobby',
        });
        expect(spot.id).toBeDefined();
        expect(spot.initialP).toBe(0.950);
        expect(spot.currentP).toBe(0.950);
        expect(spot.status).toBe(spot_status_enum_1.SpotStatus.AVAILABLE);
        expect(spot.landmarkNote).toBe('Near Main Lobby');
    });
    it('should rank candidates within 500m by probability and proximity', async () => {
        await service.persistVacatedSpot({
            latitude: 3.1391,
            longitude: 101.6869,
            landmarkNote: 'Spot A - Close',
        });
        await service.persistVacatedSpot({
            latitude: 3.1410,
            longitude: 101.6869,
            landmarkNote: 'Spot B - 300m',
        });
        await service.persistVacatedSpot({
            latitude: 3.2000,
            longitude: 101.6869,
            landmarkNote: 'Spot C - Far',
        });
        const result = await service.queryTopCandidateSpots({
            latitude: 3.1390,
            longitude: 101.6869,
            radiusMeters: 500,
        });
        expect(result.candidates.length).toBe(2);
        expect(result.candidates[0].landmarkNote).toBe('Spot A - Close');
        expect(result.candidates[0].distanceMeters).toBeLessThan(result.candidates[1].distanceMeters);
        expect(result.candidates[0].probabilityLabel).toBe('High Chance');
    });
    it('should batch decay active spots and mark expired ones as EXPIRED', async () => {
        const oldSpot = await service.persistVacatedSpot({
            latitude: 3.1390,
            longitude: 101.6869,
        });
        oldSpot.vacatedAt = new Date(Date.now() - 16 * 60 * 1000);
        await repo.update(oldSpot);
        const freshSpot = await service.persistVacatedSpot({
            latitude: 3.1400,
            longitude: 101.6870,
        });
        const tickResult = await service.batchDecayTick();
        expect(tickResult.expiredCount).toBe(1);
        const updatedOldSpot = await repo.findById(oldSpot.id);
        expect(updatedOldSpot?.status).toBe(spot_status_enum_1.SpotStatus.EXPIRED);
        expect(updatedOldSpot?.currentP).toBe(0.0);
        const updatedFreshSpot = await repo.findById(freshSpot.id);
        expect(updatedFreshSpot?.status).toBe(spot_status_enum_1.SpotStatus.AVAILABLE);
    });
    it('should invalidate spot when marked OCCUPIED', async () => {
        const spot = await service.persistVacatedSpot({
            latitude: 3.1390,
            longitude: 101.6869,
        });
        await service.invalidateSpot(spot.id, 'OCCUPIED');
        const updated = await repo.findById(spot.id);
        expect(updated?.status).toBe(spot_status_enum_1.SpotStatus.OCCUPIED);
    });
});
//# sourceMappingURL=probabilistic.service.spec.js.map