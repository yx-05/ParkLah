import { MatchEntity } from '../entities/match.entity';
import { MatchStatus } from '../enums/match-status.enum';
export declare const MATCH_REPOSITORY_PORT: unique symbol;
export interface IMatchRepositoryPort {
    createMatch(match: MatchEntity): Promise<MatchEntity>;
    findById(id: string): Promise<MatchEntity | null>;
    update(match: MatchEntity): Promise<MatchEntity>;
    updateStatus(id: string, status: MatchStatus): Promise<void>;
    findActiveMatchByUserId(userId: string): Promise<MatchEntity | null>;
}
