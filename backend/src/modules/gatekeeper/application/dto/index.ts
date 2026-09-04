import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class LatLngDto {
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
}

export class DestinationTargetDto extends LatLngDto {
  @IsOptional()
  @IsString()
  placeId?: string;

  @IsNotEmpty()
  @IsString()
  name: string;
}

export class EvaluateDestinationDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LatLngDto)
  origin: LatLngDto;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => DestinationTargetDto)
  destination: DestinationTargetDto;
}

export class StartSearchDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LatLngDto)
  destCoords: LatLngDto;

  @IsNotEmpty()
  @IsString()
  destName: string;

  @IsOptional()
  @IsNumber()
  @Min(500)
  @Max(1500)
  radiusMeters?: number = 1000;
}

export class SearchPlacesQueryDto {
  @IsNotEmpty()
  @IsString()
  query: string;

  @IsOptional()
  @IsNumber()
  proximityLat?: number;

  @IsOptional()
  @IsNumber()
  proximityLng?: number;
}

export interface GatekeeperEvaluationResult {
  isUnlocked: boolean;
  distanceMeters: number;
  durationSeconds: number;
  polyline: string;
  unlockThreshold: string;
  reason?: string;
}
