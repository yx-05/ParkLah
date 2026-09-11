import { HttpStatus } from '@nestjs/common';
import { GatekeeperService } from '../../application/services/gatekeeper.service';
import { DemandForecastService } from '../../application/services/demand-forecast.service';
import { EvaluateDestinationDto, StartSearchDto, SearchPlacesQueryDto, LatLngDto } from '../../application/dto';
export declare class GatekeeperController {
    private readonly gatekeeperService;
    private readonly demandForecastService;
    constructor(gatekeeperService: GatekeeperService, demandForecastService: DemandForecastService);
    getDemandForecast(lat?: string, lng?: string, destinationName?: string): Promise<{
        success: boolean;
        statusCode: HttpStatus;
        data: import("../../application/services/demand-forecast.service").DemandForecastResult;
        meta: {
            timestamp: string;
        };
    }>;
    searchDestination(dto: SearchPlacesQueryDto): Promise<{
        success: boolean;
        statusCode: HttpStatus;
        data: import("../../domain/ports/google-maps-routing.port").PlacePrediction[];
        meta: {
            timestamp: string;
        };
    }>;
    evaluateDestination(dto: EvaluateDestinationDto): Promise<{
        success: boolean;
        statusCode: HttpStatus;
        data: import("../../application/dto").GatekeeperEvaluationResult;
        meta: {
            timestamp: string;
        };
    }>;
    startMatchmaking(userId: string, dto: StartSearchDto & {
        currentCoords: {
            latitude: number;
            longitude: number;
        };
    }): Promise<{
        success: boolean;
        statusCode: HttpStatus;
        data: import("../../domain/ports/searcher-spatial-repository.port").ActiveSearcherSession;
        meta: {
            timestamp: string;
        };
    }>;
    stopMatchmaking(userId: string): Promise<{
        success: boolean;
        statusCode: HttpStatus;
        data: {
            success: boolean;
        };
        meta: {
            timestamp: string;
        };
    }>;
    updateLocation(userId: string, dto: LatLngDto): Promise<{
        success: boolean;
        statusCode: HttpStatus;
        data: {
            updated: boolean;
        };
        meta: {
            timestamp: string;
        };
    }>;
}
