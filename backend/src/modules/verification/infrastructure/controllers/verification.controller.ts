import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { VerificationService } from '../../application/services/verification.service';
import { ConfirmParkedDto, ReportSpotTakenDto } from '../../application/dto';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { CurrentUser } from '../../../auth/infrastructure/decorators/current-user.decorator';

@Controller('api/v1/verification')
@UseGuards(JwtAuthGuard)
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post('confirm')
  async confirmParked(
    @CurrentUser('userId') userId: string,
    @Body() dto: ConfirmParkedDto,
  ) {
    const result = await this.verificationService.confirmParkedSuccess(userId, dto);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data: result,
      meta: { timestamp: new Date().toISOString() },
    };
  }

  @Post('spot-taken')
  async reportSpotTaken(
    @CurrentUser('userId') userId: string,
    @Body() dto: ReportSpotTakenDto,
  ) {
    const result = await this.verificationService.reportSpotTaken(userId, dto);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data: result,
      meta: { timestamp: new Date().toISOString() },
    };
  }

  @Get('disputes')
  async getDisputes(@CurrentUser('userId') userId: string) {
    const disputes = await this.verificationService.getUserDisputes(userId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data: disputes,
      meta: { timestamp: new Date().toISOString() },
    };
  }
}
