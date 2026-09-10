import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProbabilisticVacancyService } from '../../../probabilistic/application/services/probabilistic-vacancy.service';

@Injectable()
export class ProbabilisticDecayCron {
  private readonly logger = new Logger(ProbabilisticDecayCron.name);

  constructor(private readonly vacancyService: ProbabilisticVacancyService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleDecayTick(): Promise<{ updatedCount: number; expiredCount: number }> {
    const startTime = Date.now();
    const result = await this.vacancyService.batchDecayTick();
    const duration = Date.now() - startTime;

    this.logger.log(
      `[CRON:DECAY] Batch decay tick completed in ${duration}ms: ${result.updatedCount} updated, ${result.expiredCount} expired`,
    );

    return result;
  }
}
