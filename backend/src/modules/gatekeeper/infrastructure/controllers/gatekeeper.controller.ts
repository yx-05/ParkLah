import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { GatekeeperService } from '../../application/services/gatekeeper.service';
import { DemandForecastService } from '../../application/services/demand-forecast.service';
import {
  EvaluateDestinationDto,
  StartSearchDto,
  SearchPlacesQueryDto,
  LatLngDto,
} from '../../application/dto';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { CurrentUser } from '../../../auth/infrastructure/decorators/current-user.decorator';

@Controller(['api/v1/searcher', 'api/v1/gatekeeper'])
export class GatekeeperController {
  constructor(
    private readonly gatekeeperService: GatekeeperService,
    private readonly demandForecastService: DemandForecastService,
  ) {}

  @Get('demand-forecast')
  async getDemandForecast(
    @Query('latitude') lat?: string,
    @Query('longitude') lng?: string,
    @Query('destinationName') destinationName?: string,
  ) {
    const latitude = lat !== undefined && lat !== '' ? parseFloat(lat) : undefined;
    const longitude = lng !== undefined && lng !== '' ? parseFloat(lng) : undefined;

    const forecast = this.demandForecastService.getForecast({
      latitude,
      longitude,
      destinationName,
    });

    return {
      success: true,
      statusCode: HttpStatus.OK,
      data: forecast,
      meta: { timestamp: new Date().toISOString() },
    };
  }

  @Post('destination/search')
  async searchDestination(@Body() dto: SearchPlacesQueryDto) {
    const results = await this.gatekeeperService.searchPlaces(dto);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data: results,
      meta: { timestamp: new Date().toISOString() },
    };
  }

  @Post('destination/evaluate')
  async evaluateDestination(@Body() dto: EvaluateDestinationDto) {
    const evaluation = await this.gatekeeperService.evaluateDestination(dto);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data: evaluation,
      meta: { timestamp: new Date().toISOString() },
    };
  }

  @Post('start')
  @UseGuards(JwtAuthGuard)
  async startMatchmaking(
    @CurrentUser('userId') userId: string,
    @Body() dto: StartSearchDto & { currentCoords: { latitude: number; longitude: number } },
  ) {
    const session = await this.gatekeeperService.startMatchmaking(
      userId,
      dto,
      dto.currentCoords || dto.destCoords,
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data: session,
      meta: { timestamp: new Date().toISOString() },
    };
  }

  @Post('stop')
  @UseGuards(JwtAuthGuard)
  async stopMatchmaking(@CurrentUser('userId') userId: string) {
    const result = await this.gatekeeperService.stopMatchmaking(userId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data: result,
      meta: { timestamp: new Date().toISOString() },
    };
  }

  @Post('location')
  @UseGuards(JwtAuthGuard)
  async updateLocation(
    @CurrentUser('userId') userId: string,
    @Body() dto: LatLngDto,
  ) {
    await this.gatekeeperService.updateSearcherLocation(userId, dto);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data: { updated: true },
      meta: { timestamp: new Date().toISOString() },
    };
  }
}
