import { HttpStatus } from '@nestjs/common';
import { ProbabilisticVacancyService } from '../../application/services/probabilistic-vacancy.service';
import { CreateProbabilisticSpotDto } from '../../application/dto';
export declare class ProbabilisticSpotController {
    private readonly vacancyService;
    constructor(vacancyService: ProbabilisticVacancyService);
    getCandidates(lat: string, lng: string, radius?: string): Promise<{
        success: boolean;
        statusCode: HttpStatus;
        data: {
            candidates: import("../../application/services/probabilistic-vacancy.service").CandidateSpotResponse[];
            totalFound: number;
        };
        meta: {
            timestamp: string;
        };
    }>;
    createSpot(userId: string, dto: CreateProbabilisticSpotDto): Promise<{
        success: boolean;
        statusCode: HttpStatus;
        data: import("../../domain/entities/probabilistic-spot.entity").ProbabilisticSpotEntity;
        meta: {
            timestamp: string;
        };
    }>;
}
