import { HttpStatus } from '@nestjs/common';
import { VerificationService } from '../../application/services/verification.service';
import { ConfirmParkedDto, ReportSpotTakenDto } from '../../application/dto';
export declare class VerificationController {
    private readonly verificationService;
    constructor(verificationService: VerificationService);
    confirmParked(userId: string, dto: ConfirmParkedDto): Promise<{
        success: boolean;
        statusCode: HttpStatus;
        data: {
            success: boolean;
            matchId: string;
            status: import("../../../matchmaker/domain/enums/match-status.enum").MatchStatus;
            completedAt: Date;
            settlement: any;
        };
        meta: {
            timestamp: string;
        };
    }>;
    reportSpotTaken(userId: string, dto: ReportSpotTakenDto): Promise<{
        success: boolean;
        statusCode: HttpStatus;
        data: {
            success: boolean;
            matchId: string;
            chargeAmount: number;
            disputeReportId: string;
            fallbackCandidates: import("../../../probabilistic/application/services/probabilistic-vacancy.service").CandidateSpotResponse[];
        };
        meta: {
            timestamp: string;
        };
    }>;
    getDisputes(userId: string): Promise<{
        success: boolean;
        statusCode: HttpStatus;
        data: import("../../domain/entities/dispute-report.entity").DisputeReportEntity[];
        meta: {
            timestamp: string;
        };
    }>;
}
