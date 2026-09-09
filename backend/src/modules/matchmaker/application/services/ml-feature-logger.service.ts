import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  IMlFeatureRepositoryPort,
  ML_FEATURE_REPOSITORY_PORT,
  MlMatchFeatureRecord,
} from '../../domain/ports/ml-feature-repository.port';

@Injectable()
export class MlFeatureLoggerService {
  private readonly logger = new Logger(MlFeatureLoggerService.name);

  constructor(
    @Inject(ML_FEATURE_REPOSITORY_PORT)
    private readonly featureRepo: IMlFeatureRepositoryPort,
  ) {}

  /**
   * Asynchronously logs an inference snapshot without blocking the real-time match offer flow.
   */
  async logInferenceSnapshot(record: MlMatchFeatureRecord): Promise<void> {
    try {
      await this.featureRepo.saveFeatureSnapshot(record);
    } catch (err: any) {
      this.logger.error(`Failed to log ML feature snapshot: ${err.message}`, err.stack);
    }
  }

  /**
   * Updates the ground truth outcome when a match concludes or fails.
   */
  async recordOutcome(
    matchId: string,
    outcome: 0 | 1,
    reason: string,
  ): Promise<void> {
    try {
      await this.featureRepo.updateOutcome(matchId, outcome, reason, new Date());
    } catch (err: any) {
      this.logger.error(
        `Failed to record ML ground truth outcome for match ${matchId}: ${err.message}`,
        err.stack,
      );
    }
  }
}
