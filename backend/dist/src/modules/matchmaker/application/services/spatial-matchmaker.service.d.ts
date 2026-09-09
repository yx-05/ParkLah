import { IMatchRepositoryPort } from '../../domain/ports/match-repository.port';
import { IDistributedLockPort } from '../../domain/ports/distributed-lock.port';
import { CandidateDiscoveryService } from '../../infrastructure/services/candidate-discovery.service';
import { ProbabilisticVacancyService } from '../../../probabilistic/application/services/probabilistic-vacancy.service';
import { SocketBroadcasterService } from '../../../gateway/application/services/socket-broadcaster.service';
import { MlFeatureLoggerService } from './ml-feature-logger.service';
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
    spotTypeEnum?: number;
    excludedSearcherIds?: string[];
}
export declare class SpatialMatchmakerService {
    private readonly matchRepository;
    private readonly distributedLock;
    private readonly candidateDiscovery;
    private readonly probabilisticService;
    private readonly socketBroadcaster;
    private readonly mlFeatureLogger?;
    static readonly MIN_MATCH_PROBABILITY_CUTOFF = 0.4;
    private readonly declinedSearchersBySpot;
    constructor(matchRepository: IMatchRepositoryPort, distributedLock: IDistributedLockPort, candidateDiscovery: CandidateDiscoveryService, probabilisticService: ProbabilisticVacancyService, socketBroadcaster: SocketBroadcasterService, mlFeatureLogger?: MlFeatureLoggerService);
    findAndOfferMatch(request: LeaverMatchRequest): Promise<{
        matched: boolean;
        match?: MatchEntity;
        fallbackSpotId?: string;
        predictedProbability?: number;
        dispatchRank?: number;
    }>;
    acceptMatch(matchId: string, searcherId: string): Promise<MatchEntity>;
    declineMatch(matchId: string, searcherId: string): Promise<MatchEntity>;
    handleHandshakeTimeout(matchId: string): Promise<void>;
    recordParkedSuccess(matchId: string): Promise<void>;
    recordSpotTakenFailure(matchId: string): Promise<void>;
    getMatchById(matchId: string): Promise<MatchEntity | null>;
}
