import { Module } from '@nestjs/common';
import { SpatialMatchmakerService } from './application/services/spatial-matchmaker.service';
import { MatchScoringEngine } from './domain/services/match-scoring.engine';
import { PharosCandidateFilterService } from './domain/services/pharos-candidate-filter.service';
import { CandidateDiscoveryService } from './infrastructure/services/candidate-discovery.service';
import { MatchmakerController } from './infrastructure/controllers/matchmaker.controller';
import { MATCH_REPOSITORY_PORT } from './domain/ports/match-repository.port';
import { DISTRIBUTED_LOCK_PORT } from './domain/ports/distributed-lock.port';
import { ROAD_ROUTING_PORT } from './domain/ports/road-routing.port';
import { ML_MATCH_SCORING_PORT } from './domain/ports/ml-match-scoring.port';
import { ML_FEATURE_REPOSITORY_PORT } from './domain/ports/ml-feature-repository.port';
import { PostgresMatchRepository } from './infrastructure/adapters/postgres-match.repository';
import { RedisDistributedLockAdapter } from './infrastructure/adapters/redis-lock.adapter';
import { InMemoryMatchRepository } from './infrastructure/adapters/in-memory-match.repository';
import { InMemoryLockAdapter } from './infrastructure/adapters/in-memory-lock.adapter';
import { OsrmRoadRoutingAdapter } from './infrastructure/adapters/osrm-road-routing.adapter';
import { OnnxMlMatchScoringAdapter } from './infrastructure/adapters/onnx-ml-match-scoring.adapter';
import { PostgresMlFeatureRepository } from './infrastructure/repositories/postgres-ml-feature.repository';
import { MlFeatureLoggerService } from './application/services/ml-feature-logger.service';
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
    PharosCandidateFilterService,
    CandidateDiscoveryService,
    MlFeatureLoggerService,
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
    {
      provide: ROAD_ROUTING_PORT,
      useFactory: () => new OsrmRoadRoutingAdapter(),
    },
    {
      provide: ML_MATCH_SCORING_PORT,
      useFactory: () => new OnnxMlMatchScoringAdapter(),
    },
    {
      provide: ML_FEATURE_REPOSITORY_PORT,
      useFactory: () => new PostgresMlFeatureRepository(),
    },
  ],
  exports: [
    SpatialMatchmakerService,
    MatchScoringEngine,
    PharosCandidateFilterService,
    CandidateDiscoveryService,
    MlFeatureLoggerService,
    MATCH_REPOSITORY_PORT,
    DISTRIBUTED_LOCK_PORT,
    ROAD_ROUTING_PORT,
    ML_MATCH_SCORING_PORT,
    ML_FEATURE_REPOSITORY_PORT,
  ],
})
export class SpatialMatchmakerModule {}
