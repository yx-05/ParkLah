import { Pool } from 'pg';
import { IMatchRepositoryPort } from '../../domain/ports/match-repository.port';
import { MatchEntity } from '../../domain/entities/match.entity';
import { MatchStatus } from '../../domain/enums/match-status.enum';
export declare class PostgresMatchRepository implements IMatchRepositoryPort {
    private pool;
    constructor(pool?: Pool);
    createMatch(match: MatchEntity): Promise<MatchEntity>;
    findById(id: string): Promise<MatchEntity | null>;
    update(match: MatchEntity): Promise<MatchEntity>;
    updateStatus(id: string, status: MatchStatus): Promise<void>;
    findActiveMatchByUserId(userId: string): Promise<MatchEntity | null>;
    private mapToEntity;
}
