import { Module } from '@nestjs/common';
import { LeaverBroadcastService } from './application/services/leaver-broadcast.service';
import { LeaverController } from './infrastructure/controllers/leaver.controller';
import { LEAVER_SPATIAL_REPOSITORY_PORT } from './domain/ports/leaver-spatial-repository.port';
import { EVENT_PUBLISHER_PORT } from './domain/ports/event-publisher.port';
import { RedisLeaverSpatialRepository } from './infrastructure/adapters/redis-leaver-spatial.repository';
import { RedisEventPublisherAdapter } from './infrastructure/adapters/redis-event-publisher.adapter';
import { InMemoryLeaverSpatialRepository } from './infrastructure/adapters/in-memory-leaver-spatial.repository';
import { InMemoryEventPublisherAdapter } from './infrastructure/adapters/in-memory-event-publisher.adapter';
import { AuthModule } from '../auth/auth.module';
import { SpatialMatchmakerModule } from '../matchmaker/spatial-matchmaker.module';

@Module({
  imports: [AuthModule, SpatialMatchmakerModule],
  controllers: [LeaverController],
  providers: [
    LeaverBroadcastService,
    {
      provide: LEAVER_SPATIAL_REPOSITORY_PORT,
      useFactory: () => {
        return process.env.REDIS_URL
          ? new RedisLeaverSpatialRepository()
          : new InMemoryLeaverSpatialRepository();
      },
    },
    {
      provide: EVENT_PUBLISHER_PORT,
      useFactory: () => {
        return process.env.REDIS_URL
          ? new RedisEventPublisherAdapter()
          : new InMemoryEventPublisherAdapter();
      },
    },
  ],
  exports: [
    LeaverBroadcastService,
    LEAVER_SPATIAL_REPOSITORY_PORT,
    EVENT_PUBLISHER_PORT,
  ],
})
export class LeaverBroadcastModule {}
