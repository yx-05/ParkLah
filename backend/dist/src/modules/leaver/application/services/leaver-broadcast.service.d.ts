import { ILeaverSpatialRepositoryPort } from '../../domain/ports/leaver-spatial-repository.port';
import { IEventPublisherPort } from '../../domain/ports/event-publisher.port';
import { IUserRepositoryPort } from '../../../auth/domain/ports/user-repository.port';
import { SpatialMatchmakerService } from '../../../matchmaker/application/services/spatial-matchmaker.service';
import { DepartureBroadcastDto, CancelDepartureDto, SyncCountdownDto, LeaverSessionData } from '../dto';
export declare class LeaverBroadcastService {
    private readonly spatialRepository;
    private readonly eventPublisher;
    private readonly userRepository;
    private readonly spatialMatchmaker?;
    constructor(spatialRepository: ILeaverSpatialRepositoryPort, eventPublisher: IEventPublisherPort, userRepository: IUserRepositoryPort, spatialMatchmaker?: SpatialMatchmakerService);
    broadcastDeparture(leaverId: string, dto: DepartureBroadcastDto): Promise<LeaverSessionData>;
    syncCountdown(leaverId: string, dto: SyncCountdownDto): Promise<{
        success: boolean;
    }>;
    cancelDeparture(leaverId: string, dto: CancelDepartureDto): Promise<{
        success: boolean;
        penaltyApplied: boolean;
        message: string;
    }>;
    getSession(leaverId: string): Promise<LeaverSessionData | null>;
}
