import { IMatchRepositoryPort } from '../../domain/ports/match-repository.port';
import { IDistributedLockPort } from '../../domain/ports/distributed-lock.port';
import { CandidateDiscoveryService } from '../../infrastructure/services/candidate-discovery.service';
import { ProbabilisticVacancyService } from '../../../probabilistic/application/services/probabilistic-vacancy.service';
import { SocketBroadcasterService } from '../../../gateway/application/services/socket-broadcaster.service';
import { MatchEntity } from '../../domain/entities/match.entity';
import { LatLng } from '../../../gatekeeper/domain/ports/google-maps-routing.port';
export interface LeaverMatchRequest {
    leaverId: string;
    spotCoords: LatLng;
    countdownSeconds: number;
    vehicleSummary?: {
        makeModel: string;
        color: string;
        plateSuffix: string;
    };
    landmarkNote?: string;
}
export declare class SpatialMatchmakerService {
    private readonly matchRepository;
    private readonly distributedLock;
    private readonly candidateDiscovery;
    private readonly probabilisticService;
    private readonly socketBroadcaster;
    constructor(matchRepository: IMatchRepositoryPort, distributedLock: IDistributedLockPort, candidateDiscovery: CandidateDiscoveryService, probabilisticService: ProbabilisticVacancyService, socketBroadcaster: SocketBroadcasterService);
    findAndOfferMatch(request: LeaverMatchRequest): Promise<{
        matched: boolean;
        match?: MatchEntity;
        fallbackSpotId?: string;
    }>;
    acceptMatch(matchId: string, searcherId: string): Promise<MatchEntity>;
    declineMatch(matchId: string, searcherId: string): Promise<MatchEntity>;
    handleHandshakeTimeout(matchId: string): Promise<void>;
    getMatchById(matchId: string): Promise<MatchEntity | null>;
}
