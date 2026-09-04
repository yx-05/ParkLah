import { ProbabilisticVacancyService } from '../../../probabilistic/application/services/probabilistic-vacancy.service';
export declare class ProbabilisticDecayCron {
    private readonly vacancyService;
    private readonly logger;
    constructor(vacancyService: ProbabilisticVacancyService);
    handleDecayTick(): Promise<{
        updatedCount: number;
        expiredCount: number;
    }>;
}
