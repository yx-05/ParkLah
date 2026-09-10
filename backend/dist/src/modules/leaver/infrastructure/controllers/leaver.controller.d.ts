import { HttpStatus } from '@nestjs/common';
import { LeaverBroadcastService } from '../../application/services/leaver-broadcast.service';
import { DepartureBroadcastDto, CancelDepartureDto, SyncCountdownDto } from '../../application/dto';
export declare class LeaverController {
    private readonly leaverService;
    constructor(leaverService: LeaverBroadcastService);
    broadcastDeparture(userId: string, dto: DepartureBroadcastDto): Promise<{
        success: boolean;
        statusCode: HttpStatus;
        data: import("../../application/dto").LeaverSessionData;
        meta: {
            timestamp: string;
        };
    }>;
    syncCountdown(userId: string, dto: SyncCountdownDto): Promise<{
        success: boolean;
        statusCode: HttpStatus;
        data: {
            success: boolean;
        };
        meta: {
            timestamp: string;
        };
    }>;
    cancelDeparture(userId: string, dto: CancelDepartureDto): Promise<{
        success: boolean;
        statusCode: HttpStatus;
        data: {
            success: boolean;
            penaltyApplied: boolean;
            message: string;
        };
        meta: {
            timestamp: string;
        };
    }>;
    getSession(userId: string): Promise<{
        success: boolean;
        statusCode: HttpStatus;
        data: import("../../application/dto").LeaverSessionData;
        meta: {
            timestamp: string;
        };
    }>;
}
