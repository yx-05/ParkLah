import { ProbabilisticVacancyService } from '../../../src/modules/probabilistic/application/services/probabilistic-vacancy.service';
import { DecayEngine } from '../../../src/modules/probabilistic/domain/services/decay.engine';
import { InMemoryProbabilisticSpotRepository } from '../../../src/modules/probabilistic/infrastructure/adapters/in-memory-probabilistic-spot.repository';
import { SpotStatus } from '../../../src/modules/probabilistic/domain/enums/spot-status.enum';

describe('ProbabilisticVacancyService (Module 6 Unit Tests)', () => {
  let service: ProbabilisticVacancyService;
  let repo: InMemoryProbabilisticSpotRepository;
  let decayEngine: DecayEngine;

  beforeEach(() => {
    repo = new InMemoryProbabilisticSpotRepository();
    decayEngine = new DecayEngine();
    service = new ProbabilisticVacancyService(repo, decayEngine);
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
    expect(spot.status).toBe(SpotStatus.AVAILABLE);
    expect(spot.landmarkNote).toBe('Near Main Lobby');
  });

  it('should rank candidates within 500m by probability and proximity', async () => {
    // Spot 1: Very close (100m)
    await service.persistVacatedSpot({
      latitude: 3.1391,
      longitude: 101.6869,
      landmarkNote: 'Spot A - Close',
    });

    // Spot 2: 300m away
    await service.persistVacatedSpot({
      latitude: 3.1410,
      longitude: 101.6869,
      landmarkNote: 'Spot B - 300m',
    });

    // Spot 3: Far away (5km) - should be excluded from 500m radius query
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
    // Persist a spot vacated 14 minutes ago
    const oldSpot = await service.persistVacatedSpot({
      latitude: 3.1390,
      longitude: 101.6869,
    });
    // Set vacatedAt to 16 minutes ago
    (oldSpot as any).vacatedAt = new Date(Date.now() - 16 * 60 * 1000);
    await repo.update(oldSpot);

    const freshSpot = await service.persistVacatedSpot({
      latitude: 3.1400,
      longitude: 101.6870,
    });

    const tickResult = await service.batchDecayTick();
    expect(tickResult.expiredCount).toBe(1);

    const updatedOldSpot = await repo.findById(oldSpot.id);
    expect(updatedOldSpot?.status).toBe(SpotStatus.EXPIRED);
    expect(updatedOldSpot?.currentP).toBe(0.0);

    const updatedFreshSpot = await repo.findById(freshSpot.id);
    expect(updatedFreshSpot?.status).toBe(SpotStatus.AVAILABLE);
  });

  it('should invalidate spot when marked OCCUPIED', async () => {
    const spot = await service.persistVacatedSpot({
      latitude: 3.1390,
      longitude: 101.6869,
    });

    await service.invalidateSpot(spot.id, 'OCCUPIED');

    const updated = await repo.findById(spot.id);
    expect(updated?.status).toBe(SpotStatus.OCCUPIED);
  });
});
