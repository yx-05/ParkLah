import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { SpatialMatchmakerService } from '../../application/services/spatial-matchmaker.service';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { CurrentUser } from '../../../auth/infrastructure/decorators/current-user.decorator';

@Controller(['api/v1/matches', 'api/v1/matchmaker'])
@UseGuards(JwtAuthGuard)
export class MatchmakerController {
  constructor(private readonly matchmakerService: SpatialMatchmakerService) {}

  @Post(':id/accept')
  async acceptMatch(
    @CurrentUser('userId') userId: string,
    @Param('id') matchId: string,
  ) {
    const match = await this.matchmakerService.acceptMatch(matchId, userId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data: match,
      meta: { timestamp: new Date().toISOString() },
    };
  }

  @Post(':id/decline')
  async declineMatch(
    @CurrentUser('userId') userId: string,
    @Param('id') matchId: string,
  ) {
    const match = await this.matchmakerService.declineMatch(matchId, userId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data: match,
      meta: { timestamp: new Date().toISOString() },
    };
  }

  @Get(':id')
  async getMatch(@Param('id') matchId: string) {
    const match = await this.matchmakerService.getMatchById(matchId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data: match,
      meta: { timestamp: new Date().toISOString() },
    };
  }
}
