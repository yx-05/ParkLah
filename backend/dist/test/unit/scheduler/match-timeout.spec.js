"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const match_timeout_scheduler_service_1 = require("../../../src/modules/scheduler/application/services/match-timeout-scheduler.service");
describe('MatchTimeoutSchedulerService (Module 10 Unit Tests)', () => {
    let timeoutScheduler;
    let matchmakerService;
    beforeEach(() => {
        jest.useFakeTimers();
        matchmakerService = {
            handleHandshakeTimeout: jest.fn().mockResolvedValue(undefined),
        };
        timeoutScheduler = new match_timeout_scheduler_service_1.MatchTimeoutSchedulerService(matchmakerService);
    });
    afterEach(() => {
        timeoutScheduler.clearAll();
        jest.useRealTimers();
    });
    it('should trigger handleHandshakeTimeout after 15 seconds', () => {
        const matchId = 'match-timeout-123';
        timeoutScheduler.scheduleHandshakeTimeout(matchId, 15000);
        expect(timeoutScheduler.getActiveTimeoutsCount()).toBe(1);
        jest.advanceTimersByTime(14900);
        expect(matchmakerService.handleHandshakeTimeout).not.toHaveBeenCalled();
        jest.advanceTimersByTime(200);
        expect(matchmakerService.handleHandshakeTimeout).toHaveBeenCalledWith(matchId);
        expect(timeoutScheduler.getActiveTimeoutsCount()).toBe(0);
    });
    it('should cancel timeout and not invoke handleHandshakeTimeout if cancelled early', () => {
        const matchId = 'match-early-accept-456';
        timeoutScheduler.scheduleHandshakeTimeout(matchId, 15000);
        jest.advanceTimersByTime(5000);
        const cancelled = timeoutScheduler.cancelHandshakeTimeout(matchId);
        expect(cancelled).toBe(true);
        expect(timeoutScheduler.getActiveTimeoutsCount()).toBe(0);
        jest.advanceTimersByTime(15000);
        expect(matchmakerService.handleHandshakeTimeout).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=match-timeout.spec.js.map