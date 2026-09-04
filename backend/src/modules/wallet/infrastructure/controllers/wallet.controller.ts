import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { WalletService } from '../../application/services/wallet.service';
import { TopUpDto, CashOutDto } from '../../application/dto';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { CurrentUser } from '../../../auth/infrastructure/decorators/current-user.decorator';

@Controller('api/v1/wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('balance')
  async getBalance(@CurrentUser('userId') userId: string) {
    const data = await this.walletService.getBalance(userId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data,
      meta: { timestamp: new Date().toISOString() },
    };
  }

  @Get('transactions')
  async getTransactions(
    @CurrentUser('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const data = await this.walletService.getTransactions(userId, pageNum, limitNum);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data,
      meta: { timestamp: new Date().toISOString() },
    };
  }

  @Post('mock/topup')
  async mockTopUp(
    @CurrentUser('userId') userId: string,
    @Body() dto: TopUpDto,
  ) {
    const data = await this.walletService.topUp(userId, dto);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data,
      meta: { timestamp: new Date().toISOString() },
    };
  }

  @Post('mock/cashout')
  async mockCashOut(
    @CurrentUser('userId') userId: string,
    @Body() dto: CashOutDto,
  ) {
    const data = await this.walletService.cashOut(userId, dto);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data,
      meta: { timestamp: new Date().toISOString() },
    };
  }
}
