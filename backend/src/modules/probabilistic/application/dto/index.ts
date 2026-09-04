import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateProbabilisticSpotDto {
  @IsOptional()
  @IsString()
  leaverId?: string;

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
  @Min(0.8)
  @Max(1.0)
  areaTrafficMultiplier?: number;

  @IsOptional()
  @IsString()
  landmarkNote?: string;
}

export class QueryCandidateSpotsDto {
  @IsNotEmpty()
  @IsNumber()
  latitude: number;

  @IsNotEmpty()
  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(3000)
  radiusMeters?: number = 500;
}
