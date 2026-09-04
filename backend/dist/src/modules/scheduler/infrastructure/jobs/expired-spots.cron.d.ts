import { ProbabilisticVacancyService } from '../../../probabilistic/application/services/probabilistic-vacancy.service';
export declare class ExpiredSpotsCron {
    private readonly vacancyService;
    private readonly logger;
    constructor(vacancyService: ProbabilisticVacancyService);
    handleExpiredPurge(): Promise<{
        expiredCount: number;
    }>;
}
