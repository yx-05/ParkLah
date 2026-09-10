import { IDisputeRepositoryPort } from '../../domain/ports/dispute-repository.port';
import { IMatchRepositoryPort } from '../../../matchmaker/domain/ports/match-repository.port';
import { IUserRepositoryPort } from '../../../auth/domain/ports/user-repository.port';
import { GeofenceEngine, DriverTelemetry, GeofenceEvaluationResult } from '../../domain/services/geofence.engine';
import { WalletService } from '../../../wallet/application/services/wallet.service';
import { ProbabilisticVacancyService } from '../../../probabilistic/application/services/probabilistic-vacancy.service';
import { SocketBroadcasterService } from '../../../gateway/application/services/socket-broadcaster.service';
import { DisputeReportEntity } from '../../domain/entities/dispute-report.entity';
import { ConfirmParkedDto, ReportSpotTakenDto } from '../dto';
export declare class VerificationService {
    private readonly disputeRepository;
    private readonly matchRepository;
    private readonly userRepository;
    private readonly geofenceEngine;
    private readonly walletService;
    private readonly probabilisticService;
    private readonly socketBroadcaster;
    constructor(disputeRepository: IDisputeRepositoryPort, matchRepository: IMatchRepositoryPort, userRepository: IUserRepositoryPort, geofenceEngine: GeofenceEngine, walletService: WalletService, probabilisticService: ProbabilisticVacancyService, socketBroadcaster: SocketBroadcasterService);
    evaluateTelemetry(searcherId: string, matchId: string, telemetry: DriverTelemetry): Promise<GeofenceEvaluationResult>;
    confirmParkedSuccess(searcherId: string, dto: ConfirmParkedDto): Promise<{
        success: boolean;
        matchId: string;
        status: import("../../../matchmaker/domain/enums/match-status.enum").MatchStatus;
        completedAt: Date;
        settlement: any;
    }>;
    reportSpotTaken(searcherId: string, dto: ReportSpotTakenDto): Promise<{
        success: boolean;
        matchId: string;
        chargeAmount: number;
        disputeReportId: string;
        fallbackCandidates: import("../../../probabilistic/application/services/probabilistic-vacancy.service").CandidateSpotResponse[];
    }>;
    getUserDisputes(userId: string): Promise<DisputeReportEntity[]>;
}
