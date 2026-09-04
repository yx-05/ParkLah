import { IGoogleMapsRoutingPort, LatLng } from '../../domain/ports/google-maps-routing.port';
import { ISearcherSpatialRepositoryPort, ActiveSearcherSession } from '../../domain/ports/searcher-spatial-repository.port';
import { GatekeeperEvaluatorService } from '../../domain/services/gatekeeper-evaluator.service';
import { EvaluateDestinationDto, StartSearchDto, SearchPlacesQueryDto, GatekeeperEvaluationResult } from '../dto';
export declare class GatekeeperService {
    private readonly routingPort;
    private readonly spatialRepository;
    private readonly evaluator;
    constructor(routingPort: IGoogleMapsRoutingPort, spatialRepository: ISearcherSpatialRepositoryPort, evaluator: GatekeeperEvaluatorService);
    searchPlaces(dto: SearchPlacesQueryDto): Promise<import("../../domain/ports/google-maps-routing.port").PlacePrediction[]>;
    evaluateDestination(dto: EvaluateDestinationDto): Promise<GatekeeperEvaluationResult>;
    startMatchmaking(searcherId: string, dto: StartSearchDto, currentCoords: LatLng): Promise<ActiveSearcherSession>;
    stopMatchmaking(searcherId: string): Promise<{
        success: boolean;
    }>;
    updateSearcherLocation(searcherId: string, coords: LatLng): Promise<void>;
    getActiveSearcherSession(searcherId: string): Promise<ActiveSearcherSession | null>;
}
