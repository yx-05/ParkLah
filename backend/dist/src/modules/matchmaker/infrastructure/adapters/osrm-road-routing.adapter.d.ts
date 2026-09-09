import { IRoadRoutingPort, CandidateOrigin, RouteMatrixResult } from '../../domain/ports/road-routing.port';
import { LatLng } from '../../../gatekeeper/domain/ports/google-maps-routing.port';
export declare class OsrmRoadRoutingAdapter implements IRoadRoutingPort {
    private readonly logger;
    private readonly baseUrl;
    private readonly timeoutMs;
    constructor(baseUrl?: string, timeoutMs?: number);
    calculateCandidateRoutes(spotCoords: LatLng, candidates: CandidateOrigin[]): Promise<RouteMatrixResult[]>;
    private queryOsrmTable;
    private fallbackHaversineRoutes;
    private singleHaversineEstimate;
}
