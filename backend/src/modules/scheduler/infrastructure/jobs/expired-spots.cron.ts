import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProbabilisticVacancyService } from '../../../probabilistic/application/services/probabilistic-vacancy.service';

@Injectable()
export class ExpiredSpotsCron {
  private readonly logger = new Logger(ExpiredSpotsCron.name);

  constructor(private readonly vacancyService: ProbabilisticVacancyService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiredPurge(): Promise<{ expiredCount: number }> {
    const expiredCount = await this.vacancyService.expireSpotsBatch();
    this.logger.log(`[CRON:PURGE] Purged ${expiredCount} expired/low-confidence spots from candidate pool`);
    return { expiredCount };
  }
}
