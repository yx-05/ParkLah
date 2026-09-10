import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SpotCoordinatesDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsOptional()
  @IsNumber()
  @Max(30, { message: 'GPS accuracy must be within 30 meters' })
  accuracy?: number;
}

export class DepartureBroadcastDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => SpotCoordinatesDto)
  coordinates: SpotCoordinatesDto;

  @IsNotEmpty()
  @IsNumber()
  @Min(0, { message: 'Countdown must be at least 0 seconds (0 for Instant broadcast)' })
  @Max(300, { message: 'Countdown must be at most 300 seconds (5 minutes)' })
  countdownSeconds: number;

  @IsOptional()
  @IsString()
  vehicleId?: string;

  @IsOptional()
  @IsString()
  @Length(0, 100, { message: 'Landmark note cannot exceed 100 characters' })
  landmarkNote?: string;
}

export class CancelDepartureDto {
  @IsOptional()
  @IsString()
  reason?: string = 'CHANGE_OF_PLANS';
}

export class SyncCountdownDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(300)
  remainingSeconds: number;
}

export interface LeaverSessionData {
  leaverId: string;
  coordinates: { latitude: number; longitude: number };
  countdownSeconds: number;
  remainingSeconds: number;
  vehicleId?: string;
  landmarkNote?: string;
  isMatched: boolean;
  matchedSearcherId?: string;
  broadcastAt: Date;
  expiresAt: Date;
}
