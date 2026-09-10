import { ProbabilisticDecayCron } from '../../../src/modules/scheduler/infrastructure/jobs/probabilistic-decay.cron';
import { ExpiredSpotsCron } from '../../../src/modules/scheduler/infrastructure/jobs/expired-spots.cron';
import { ProbabilisticVacancyService } from '../../../src/modules/probabilistic/application/services/probabilistic-vacancy.service';
import { InMemoryProbabilisticSpotRepository } from '../../../src/modules/probabilistic/infrastructure/adapters/in-memory-probabilistic-spot.repository';
import { DecayEngine } from '../../../src/modules/probabilistic/domain/services/decay.engine';

describe('BackgroundScheduler Crons (Module 10 Unit Tests)', () => {
  let decayCron: ProbabilisticDecayCron;
  let expiredCron: ExpiredSpotsCron;
  let vacancyService: ProbabilisticVacancyService;
  let spotRepo: InMemoryProbabilisticSpotRepository;

  beforeEach(() => {
    spotRepo = new InMemoryProbabilisticSpotRepository();
    const decayEngine = new DecayEngine();
    vacancyService = new ProbabilisticVacancyService(spotRepo, decayEngine);

    decayCron = new ProbabilisticDecayCron(vacancyService);
    expiredCron = new ExpiredSpotsCron(vacancyService);
  });

  it('should trigger batchDecayTick on decay cron execution', async () => {
    // Add an active spot
    await vacancyService.persistVacatedSpot({
      latitude: 3.139,
      longitude: 101.686,
    });

    const result = await decayCron.handleDecayTick();
    expect(result.updatedCount).toBe(1);
    expect(result.expiredCount).toBe(0);
  });

  it('should trigger expireSpotsBatch on expired spots cleanup cron execution', async () => {
    const result = await expiredCron.handleExpiredPurge();
    expect(result.expiredCount).toBe(0);
  });
});
