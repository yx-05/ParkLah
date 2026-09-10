import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { LeaverBroadcastService } from '../../application/services/leaver-broadcast.service';
import {
  DepartureBroadcastDto,
  CancelDepartureDto,
  SyncCountdownDto,
} from '../../application/dto';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { CurrentUser } from '../../../auth/infrastructure/decorators/current-user.decorator';

@Controller('api/v1/leaver')
@UseGuards(JwtAuthGuard)
export class LeaverController {
  constructor(private readonly leaverService: LeaverBroadcastService) {}

  @Post('broadcast')
  async broadcastDeparture(
    @CurrentUser('userId') userId: string,
    @Body() dto: DepartureBroadcastDto,
  ) {
    const session = await this.leaverService.broadcastDeparture(userId, dto);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data: session,
      meta: { timestamp: new Date().toISOString() },
    };
  }

  @Post('countdown/sync')
  async syncCountdown(
    @CurrentUser('userId') userId: string,
    @Body() dto: SyncCountdownDto,
  ) {
    const result = await this.leaverService.syncCountdown(userId, dto);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data: result,
      meta: { timestamp: new Date().toISOString() },
    };
  }

  @Post('cancel')
  async cancelDeparture(
    @CurrentUser('userId') userId: string,
    @Body() dto: CancelDepartureDto,
  ) {
    const result = await this.leaverService.cancelDeparture(userId, dto);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data: result,
      meta: { timestamp: new Date().toISOString() },
    };
  }

  @Get('session')
  async getSession(@CurrentUser('userId') userId: string) {
    const session = await this.leaverService.getSession(userId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data: session,
      meta: { timestamp: new Date().toISOString() },
    };
  }
}
