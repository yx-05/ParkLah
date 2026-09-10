import { Module } from '@nestjs/common';
import { GatekeeperService } from './application/services/gatekeeper.service';
import { GatekeeperEvaluatorService } from './domain/services/gatekeeper-evaluator.service';
import { GatekeeperController } from './infrastructure/controllers/gatekeeper.controller';
import { GOOGLE_MAPS_ROUTING_PORT } from './domain/ports/google-maps-routing.port';
import { SEARCHER_SPATIAL_REPOSITORY_PORT } from './domain/ports/searcher-spatial-repository.port';
import { GoogleMapsRoutingAdapter } from './infrastructure/adapters/google-maps-routing.adapter';
import { MockGoogleMapsRoutingAdapter } from './infrastructure/adapters/mock-google-maps.adapter';
import { RedisSearcherSpatialRepository } from './infrastructure/adapters/redis-searcher-spatial.repository';
import { InMemorySearcherSpatialRepository } from './infrastructure/adapters/in-memory-searcher-spatial.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [GatekeeperController],
  providers: [
    GatekeeperService,
    GatekeeperEvaluatorService,
    {
      provide: GOOGLE_MAPS_ROUTING_PORT,
      useClass: GoogleMapsRoutingAdapter,
    },
    {
      provide: SEARCHER_SPATIAL_REPOSITORY_PORT,
      useFactory: () => {
        return process.env.REDIS_URL
          ? new RedisSearcherSpatialRepository()
          : new InMemorySearcherSpatialRepository();
      },
    },
  ],
  exports: [
    GatekeeperService,
    GatekeeperEvaluatorService,
    GOOGLE_MAPS_ROUTING_PORT,
    SEARCHER_SPATIAL_REPOSITORY_PORT,
  ],
})
export class GatekeeperModule {}
