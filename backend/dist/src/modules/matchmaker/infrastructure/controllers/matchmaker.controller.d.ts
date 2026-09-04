import { HttpStatus } from '@nestjs/common';
import { SpatialMatchmakerService } from '../../application/services/spatial-matchmaker.service';
export declare class MatchmakerController {
    private readonly matchmakerService;
    constructor(matchmakerService: SpatialMatchmakerService);
    acceptMatch(userId: string, matchId: string): Promise<{
        success: boolean;
        statusCode: HttpStatus;
        data: import("../../domain/entities/match.entity").MatchEntity;
        meta: {
            timestamp: string;
        };
    }>;
    declineMatch(userId: string, matchId: string): Promise<{
        success: boolean;
        statusCode: HttpStatus;
        data: import("../../domain/entities/match.entity").MatchEntity;
        meta: {
            timestamp: string;
        };
    }>;
    getMatch(matchId: string): Promise<{
        success: boolean;
        statusCode: HttpStatus;
        data: import("../../domain/entities/match.entity").MatchEntity;
        meta: {
            timestamp: string;
        };
    }>;
}
