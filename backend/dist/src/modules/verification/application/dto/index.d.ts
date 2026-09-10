import { DisputeType } from '../../domain/enums/dispute-type.enum';
import { LatLngDto } from '../../../gatekeeper/application/dto';
export declare class DriverTelemetryDto {
    coordinates: LatLngDto;
    speedKmh: number;
    stationaryDurationSeconds: number;
}
export declare class ConfirmParkedDto {
    matchId: string;
}
export declare class ReportSpotTakenDto {
    matchId: string;
    spotId?: string;
    disputeType?: DisputeType;
    description?: string;
}
