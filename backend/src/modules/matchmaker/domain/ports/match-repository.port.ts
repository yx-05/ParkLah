import { MatchEntity } from '../entities/match.entity';
import { MatchStatus } from '../enums/match-status.enum';

export const MATCH_REPOSITORY_PORT = Symbol('IMatchRepositoryPort');

export interface IMatchRepositoryPort {
  createMatch(match: MatchEntity): Promise<MatchEntity>;
  findById(id: string): Promise<MatchEntity | null>;
  update(match: MatchEntity): Promise<MatchEntity>;
  updateStatus(id: string, status: MatchStatus): Promise<void>;
  findActiveMatchByUserId(userId: string): Promise<MatchEntity | null>;
}
