import { Module } from '@nestjs/common';
import { SpatialMatchmakerService } from './application/services/spatial-matchmaker.service';
import { MatchScoringEngine } from './domain/services/match-scoring.engine';
import { CandidateDiscoveryService } from './infrastructure/services/candidate-discovery.service';
import { MatchmakerController } from './infrastructure/controllers/matchmaker.controller';
import { MATCH_REPOSITORY_PORT } from './domain/ports/match-repository.port';
import { DISTRIBUTED_LOCK_PORT } from './domain/ports/distributed-lock.port';
import { PostgresMatchRepository } from './infrastructure/adapters/postgres-match.repository';
import { RedisDistributedLockAdapter } from './infrastructure/adapters/redis-lock.adapter';
import { InMemoryMatchRepository } from './infrastructure/adapters/in-memory-match.repository';
import { InMemoryLockAdapter } from './infrastructure/adapters/in-memory-lock.adapter';
import { GatekeeperModule } from '../gatekeeper/gatekeeper.module';
import { ProbabilisticVacancyModule } from '../probabilistic/probabilistic-vacancy.module';
import { RealTimeGatewayModule } from '../gateway/gateway.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    GatekeeperModule,
    ProbabilisticVacancyModule,
    RealTimeGatewayModule,
  ],
  controllers: [MatchmakerController],
  providers: [
    SpatialMatchmakerService,
    MatchScoringEngine,
    CandidateDiscoveryService,
    {
      provide: MATCH_REPOSITORY_PORT,
      useFactory: () => {
        return process.env.DATABASE_URL
          ? new PostgresMatchRepository()
          : new InMemoryMatchRepository();
      },
    },
    {
      provide: DISTRIBUTED_LOCK_PORT,
      useFactory: () => {
        return process.env.REDIS_URL
          ? new RedisDistributedLockAdapter()
          : new InMemoryLockAdapter();
      },
    },
  ],
  exports: [
    SpatialMatchmakerService,
    MatchScoringEngine,
    CandidateDiscoveryService,
    MATCH_REPOSITORY_PORT,
    DISTRIBUTED_LOCK_PORT,
  ],
})
export class SpatialMatchmakerModule {}
