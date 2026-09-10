import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { GatekeeperService } from '../../application/services/gatekeeper.service';
import {
  EvaluateDestinationDto,
  StartSearchDto,
  SearchPlacesQueryDto,
} from '../../application/dto';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { CurrentUser } from '../../../auth/infrastructure/decorators/current-user.decorator';

@Controller('api/v1/searcher')
export class GatekeeperController {
  constructor(private readonly gatekeeperService: GatekeeperService) {}

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
}
