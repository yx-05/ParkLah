import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ProbabilisticDecayCron } from './infrastructure/jobs/probabilistic-decay.cron';
import { ExpiredSpotsCron } from './infrastructure/jobs/expired-spots.cron';
import { MatchTimeoutSchedulerService } from './application/services/match-timeout-scheduler.service';
import { SchedulerHealthService } from './infrastructure/services/scheduler-health.service';
import { ProbabilisticVacancyModule } from '../probabilistic/probabilistic-vacancy.module';
import { SpatialMatchmakerModule } from '../matchmaker/spatial-matchmaker.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ProbabilisticVacancyModule,
    SpatialMatchmakerModule,
  ],
  providers: [
    ProbabilisticDecayCron,
    ExpiredSpotsCron,
    MatchTimeoutSchedulerService,
    SchedulerHealthService,
  ],
  exports: [
    ProbabilisticDecayCron,
    ExpiredSpotsCron,
    MatchTimeoutSchedulerService,
    SchedulerHealthService,
  ],
})
export class BackgroundSchedulerModule {}
