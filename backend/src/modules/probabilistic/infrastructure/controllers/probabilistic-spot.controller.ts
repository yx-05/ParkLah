import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ProbabilisticVacancyService } from '../../application/services/probabilistic-vacancy.service';
import { CreateProbabilisticSpotDto } from '../../application/dto';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { CurrentUser } from '../../../auth/infrastructure/decorators/current-user.decorator';

@Controller('api/v1/spots')
export class ProbabilisticSpotController {
  constructor(private readonly vacancyService: ProbabilisticVacancyService) {}

  @Get('candidates')
  async getCandidates(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius?: string,
  ) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusMeters = radius ? parseInt(radius, 10) : 500;

    const data = await this.vacancyService.queryTopCandidateSpots({
      latitude,
      longitude,
      radiusMeters,
    });

    return {
      success: true,
      statusCode: HttpStatus.OK,
      data,
      meta: { timestamp: new Date().toISOString() },
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createSpot(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateProbabilisticSpotDto,
  ) {
    dto.leaverId = userId;
    const spot = await this.vacancyService.persistVacatedSpot(dto);
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      data: spot,
      meta: { timestamp: new Date().toISOString() },
    };
  }
}
