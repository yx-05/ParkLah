import { IsNotEmpty, IsOptional, IsString, IsEnum, IsNumber, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { DisputeType } from '../../domain/enums/dispute-type.enum';
import { LatLngDto } from '../../../gatekeeper/application/dto';

export class DriverTelemetryDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LatLngDto)
  coordinates: LatLngDto;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  speedKmh: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  stationaryDurationSeconds: number;
}

export class ConfirmParkedDto {
  @IsNotEmpty()
  @IsString()
  matchId: string;
}

export class ReportSpotTakenDto {
  @IsNotEmpty()
  @IsString()
  matchId: string;

  @IsOptional()
  @IsString()
  spotId?: string;

  @IsOptional()
  @IsEnum(DisputeType)
  disputeType?: DisputeType = DisputeType.SPOT_TAKEN_BY_STRANGER;

  @IsOptional()
  @IsString()
  description?: string;
}
