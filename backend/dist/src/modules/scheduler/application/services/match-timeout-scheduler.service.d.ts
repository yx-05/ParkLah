import { SpatialMatchmakerService } from '../../../matchmaker/application/services/spatial-matchmaker.service';
export declare class MatchTimeoutSchedulerService {
    private readonly matchmakerService;
    private readonly logger;
    private activeTimers;
    constructor(matchmakerService: SpatialMatchmakerService);
    scheduleHandshakeTimeout(matchId: string, delayMs?: number): void;
    cancelHandshakeTimeout(matchId: string): boolean;
    getActiveTimeoutsCount(): number;
    clearAll(): void;
}
