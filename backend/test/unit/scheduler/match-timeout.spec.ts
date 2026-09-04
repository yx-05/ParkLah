import { MatchTimeoutSchedulerService } from '../../../src/modules/scheduler/application/services/match-timeout-scheduler.service';
import { SpatialMatchmakerService } from '../../../src/modules/matchmaker/application/services/spatial-matchmaker.service';

describe('MatchTimeoutSchedulerService (Module 10 Unit Tests)', () => {
  let timeoutScheduler: MatchTimeoutSchedulerService;
  let matchmakerService: Partial<SpatialMatchmakerService>;

  beforeEach(() => {
    jest.useFakeTimers();
    matchmakerService = {
      handleHandshakeTimeout: jest.fn().mockResolvedValue(undefined),
    };
    timeoutScheduler = new MatchTimeoutSchedulerService(matchmakerService as any);
  });

  afterEach(() => {
    timeoutScheduler.clearAll();
    jest.useRealTimers();
  });

  it('should trigger handleHandshakeTimeout after 15 seconds', () => {
    const matchId = 'match-timeout-123';
    timeoutScheduler.scheduleHandshakeTimeout(matchId, 15000);

    expect(timeoutScheduler.getActiveTimeoutsCount()).toBe(1);

    // Fast-forward 14.9 seconds (should not fire yet)
    jest.advanceTimersByTime(14900);
    expect(matchmakerService.handleHandshakeTimeout).not.toHaveBeenCalled();

    // Fast-forward past 15 seconds
    jest.advanceTimersByTime(200);
    expect(matchmakerService.handleHandshakeTimeout).toHaveBeenCalledWith(matchId);
    expect(timeoutScheduler.getActiveTimeoutsCount()).toBe(0);
  });

  it('should cancel timeout and not invoke handleHandshakeTimeout if cancelled early', () => {
    const matchId = 'match-early-accept-456';
    timeoutScheduler.scheduleHandshakeTimeout(matchId, 15000);

    // Cancel at 5 seconds
    jest.advanceTimersByTime(5000);
    const cancelled = timeoutScheduler.cancelHandshakeTimeout(matchId);
    expect(cancelled).toBe(true);
    expect(timeoutScheduler.getActiveTimeoutsCount()).toBe(0);

    // Advance past 15 seconds
    jest.advanceTimersByTime(15000);
    expect(matchmakerService.handleHandshakeTimeout).not.toHaveBeenCalled();
  });
});
