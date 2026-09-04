import { Injectable, Logger } from '@nestjs/common';
import { SpatialMatchmakerService } from '../../../matchmaker/application/services/spatial-matchmaker.service';

@Injectable()
export class MatchTimeoutSchedulerService {
  private readonly logger = new Logger(MatchTimeoutSchedulerService.name);
  private activeTimers = new Map<string, NodeJS.Timeout>();

  constructor(private readonly matchmakerService: SpatialMatchmakerService) {}

  public scheduleHandshakeTimeout(matchId: string, delayMs = 15000): void {
    this.cancelHandshakeTimeout(matchId);

    const timer = setTimeout(async () => {
      this.logger.warn(`[TIMEOUT] 15s Handshake expired for match [${matchId}]. Invoking timeout cascade.`);
      this.activeTimers.delete(matchId);
      try {
        await this.matchmakerService.handleHandshakeTimeout(matchId);
      } catch (err) {
        this.logger.error(`Error processing handshake timeout for match ${matchId}: ${err.message}`);
      }
    }, delayMs);

    this.activeTimers.set(matchId, timer);
    this.logger.log(`[TIMEOUT SCHEDULER] Scheduled 15s timeout for match [${matchId}]`);
  }

  public cancelHandshakeTimeout(matchId: string): boolean {
    const timer = this.activeTimers.get(matchId);
    if (timer) {
      clearTimeout(timer);
      this.activeTimers.delete(matchId);
      this.logger.log(`[TIMEOUT SCHEDULER] Cancelled timeout for match [${matchId}] (early accept/decline)`);
      return true;
    }
    return false;
  }

  public getActiveTimeoutsCount(): number {
    return this.activeTimers.size;
  }

  public clearAll(): void {
    for (const timer of this.activeTimers.values()) {
      clearTimeout(timer);
    }
    this.activeTimers.clear();
  }
}
