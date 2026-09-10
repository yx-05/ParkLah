import { Injectable } from '@nestjs/common';
import { IMatchRepositoryPort } from '../../domain/ports/match-repository.port';
import { MatchEntity } from '../../domain/entities/match.entity';
import { MatchStatus } from '../../domain/enums/match-status.enum';

@Injectable()
export class InMemoryMatchRepository implements IMatchRepositoryPort {
  private matches = new Map<string, MatchEntity>();

  async createMatch(match: MatchEntity): Promise<MatchEntity> {
    this.matches.set(match.id, match);
    return match;
  }

  async findById(id: string): Promise<MatchEntity | null> {
    return this.matches.get(id) || null;
  }

  async update(match: MatchEntity): Promise<MatchEntity> {
    this.matches.set(match.id, match);
    return match;
  }

  async updateStatus(id: string, status: MatchStatus): Promise<void> {
    const match = this.matches.get(id);
    if (match) {
      match.status = status;
    }
  }

  async findActiveMatchByUserId(userId: string): Promise<MatchEntity | null> {
    for (const match of this.matches.values()) {
      if (
        (match.searcherId === userId || match.leaverId === userId) &&
        ['OFFERED', 'ACCEPTED', 'EN_ROUTE', 'ARRIVED'].includes(match.status)
      ) {
        return match;
      }
    }
    return null;
  }

  public clear(): void {
    this.matches.clear();
  }
}
