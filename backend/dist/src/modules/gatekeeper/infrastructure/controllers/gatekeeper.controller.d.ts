import { HttpStatus } from '@nestjs/common';
import { GatekeeperService } from '../../application/services/gatekeeper.service';
import { EvaluateDestinationDto, StartSearchDto, SearchPlacesQueryDto } from '../../application/dto';
export declare class GatekeeperController {
    private readonly gatekeeperService;
    constructor(gatekeeperService: GatekeeperService);
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
}
