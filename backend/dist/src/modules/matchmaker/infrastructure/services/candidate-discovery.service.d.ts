import { ISearcherSpatialRepositoryPort } from '../../../gatekeeper/domain/ports/searcher-spatial-repository.port';
import { IUserRepositoryPort } from '../../../auth/domain/ports/user-repository.port';
import { MatchScoringEngine, MatchScoreResult } from '../../domain/services/match-scoring.engine';
import { LatLng } from '../../../gatekeeper/domain/ports/google-maps-routing.port';
export interface DiscoveredCandidate {
    searcherId: string;
    distanceMeters: number;
    score: number;
    scoreBreakdown: MatchScoreResult;
}
export declare class CandidateDiscoveryService {
    private readonly searcherRepo;
    private readonly userRepo;
    private readonly scoringEngine;
    constructor(searcherRepo: ISearcherSpatialRepositoryPort, userRepo: IUserRepositoryPort, scoringEngine: MatchScoringEngine);
    discoverAndRankCandidates(spotCoords: LatLng, leaverCountdownSeconds: number, radiusMeters?: number): Promise<DiscoveredCandidate[]>;
}
