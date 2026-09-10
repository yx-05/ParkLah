import { ISearcherSpatialRepositoryPort } from '../../../gatekeeper/domain/ports/searcher-spatial-repository.port';
import { IUserRepositoryPort } from '../../../auth/domain/ports/user-repository.port';
import { PharosCandidateFilterService } from '../../domain/services/pharos-candidate-filter.service';
import { IRoadRoutingPort } from '../../domain/ports/road-routing.port';
import { IMlMatchScoringPort, MlCandidateFeatures } from '../../domain/ports/ml-match-scoring.port';
import { LatLng } from '../../../gatekeeper/domain/ports/google-maps-routing.port';
export interface DiscoveredCandidate {
    searcherId: string;
    distanceMeters: number;
    roadDistanceMeters: number;
    roadEtaSeconds: number;
    score: number;
    features: MlCandidateFeatures;
}
export interface CandidateDiscoveryContext {
    spotCoords: LatLng;
    leaverCountdownSeconds: number;
    spotTypeEnum?: number;
    hasLandmarkNote?: boolean;
    landmarkNote?: string;
    radiusMeters?: number;
}
export declare class CandidateDiscoveryService {
    private readonly searcherRepo;
    private readonly userRepo;
    private readonly pharosFilter;
    private readonly roadRouting;
    private readonly mlScoring;
    private readonly logger;
    constructor(searcherRepo: ISearcherSpatialRepositoryPort, userRepo: IUserRepositoryPort, pharosFilter: PharosCandidateFilterService, roadRouting: IRoadRoutingPort, mlScoring: IMlMatchScoringPort);
    discoverAndRankCandidates(spotCoords: LatLng, leaverCountdownSeconds: number, radiusMeters?: number, context?: Partial<CandidateDiscoveryContext>): Promise<DiscoveredCandidate[]>;
}
