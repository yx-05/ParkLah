import { MatchTimeoutSchedulerService } from '../../application/services/match-timeout-scheduler.service';
export declare class SchedulerHealthService {
    private readonly timeoutScheduler;
    constructor(timeoutScheduler: MatchTimeoutSchedulerService);
    getSchedulerMetrics(): {
        status: string;
        activeTimeoutJobs: number;
        decayCronStatus: string;
        purgeCronStatus: string;
        timestamp: string;
    };
}
