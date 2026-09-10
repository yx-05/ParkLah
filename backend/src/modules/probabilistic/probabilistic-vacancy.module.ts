import { Module } from '@nestjs/common';
import { ProbabilisticVacancyService } from './application/services/probabilistic-vacancy.service';
import { DecayEngine } from './domain/services/decay.engine';
import { ProbabilisticSpotController } from './infrastructure/controllers/probabilistic-spot.controller';
import { PROBABILISTIC_SPOT_REPOSITORY_PORT } from './domain/ports/probabilistic-spot-repository.port';
import { PostgresProbabilisticSpotRepository } from './infrastructure/adapters/postgres-probabilistic-spot.repository';
import { InMemoryProbabilisticSpotRepository } from './infrastructure/adapters/in-memory-probabilistic-spot.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ProbabilisticSpotController],
  providers: [
    ProbabilisticVacancyService,
    DecayEngine,
    {
      provide: PROBABILISTIC_SPOT_REPOSITORY_PORT,
      useFactory: () => {
        return process.env.DATABASE_URL
          ? new PostgresProbabilisticSpotRepository()
          : new InMemoryProbabilisticSpotRepository();
      },
    },
  ],
  exports: [
    ProbabilisticVacancyService,
    DecayEngine,
    PROBABILISTIC_SPOT_REPOSITORY_PORT,
  ],
})
export class ProbabilisticVacancyModule {}
