"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const probabilistic_decay_cron_1 = require("../../../src/modules/scheduler/infrastructure/jobs/probabilistic-decay.cron");
const expired_spots_cron_1 = require("../../../src/modules/scheduler/infrastructure/jobs/expired-spots.cron");
const probabilistic_vacancy_service_1 = require("../../../src/modules/probabilistic/application/services/probabilistic-vacancy.service");
const in_memory_probabilistic_spot_repository_1 = require("../../../src/modules/probabilistic/infrastructure/adapters/in-memory-probabilistic-spot.repository");
const decay_engine_1 = require("../../../src/modules/probabilistic/domain/services/decay.engine");
describe('BackgroundScheduler Crons (Module 10 Unit Tests)', () => {
    let decayCron;
    let expiredCron;
    let vacancyService;
    let spotRepo;
    beforeEach(() => {
        spotRepo = new in_memory_probabilistic_spot_repository_1.InMemoryProbabilisticSpotRepository();
        const decayEngine = new decay_engine_1.DecayEngine();
        vacancyService = new probabilistic_vacancy_service_1.ProbabilisticVacancyService(spotRepo, decayEngine);
        decayCron = new probabilistic_decay_cron_1.ProbabilisticDecayCron(vacancyService);
        expiredCron = new expired_spots_cron_1.ExpiredSpotsCron(vacancyService);
    });
    it('should trigger batchDecayTick on decay cron execution', async () => {
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
//# sourceMappingURL=decay-cron.spec.js.map