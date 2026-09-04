import { Injectable } from '@nestjs/common';
import { MatchTimeoutSchedulerService } from '../../application/services/match-timeout-scheduler.service';

@Injectable()
export class SchedulerHealthService {
  constructor(private readonly timeoutScheduler: MatchTimeoutSchedulerService) {}

  public getSchedulerMetrics() {
    return {
      status: 'UP',
      activeTimeoutJobs: this.timeoutScheduler.getActiveTimeoutsCount(),
      decayCronStatus: 'ACTIVE_60S',
      purgeCronStatus: 'ACTIVE_60S',
      timestamp: new Date().toISOString(),
    };
  }
}
