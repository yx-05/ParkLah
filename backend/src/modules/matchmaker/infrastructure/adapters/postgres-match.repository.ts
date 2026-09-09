import { Injectable, Optional } from '@nestjs/common';
import { Pool } from 'pg';
import { getSharedPostgresPool } from '../../../../database/postgres-pool.helper';
import { IMatchRepositoryPort } from '../../domain/ports/match-repository.port';
import { MatchEntity } from '../../domain/entities/match.entity';
import { MatchStatus, MatchType } from '../../domain/enums/match-status.enum';

@Injectable()
export class PostgresMatchRepository implements IMatchRepositoryPort {
  private pool: Pool | null = null;

  constructor(@Optional() pool?: Pool) {
    if (pool) {
      this.pool = pool;
    } else {
      this.pool = getSharedPostgresPool();
    }
  }

  async createMatch(match: MatchEntity): Promise<MatchEntity> {
    if (!this.pool) return match;
    await this.pool.query(
      `INSERT INTO matches (
        id, searcher_id, leaver_id, probabilistic_spot_id, match_type, spot_geom,
        spot_latitude, spot_longitude, status, searcher_charge_amount, leaver_reward_amount,
        platform_fee_amount, handshake_timeout_seconds, offered_at, accepted_at,
        arrived_at, completed_at, cancelled_at, cancellation_reason
      ) VALUES (
        $1, $2, $3, $4, $5, ST_SetSRID(ST_MakePoint($7, $6), 4326),
        $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
      )`,
      [
        match.id,
        match.searcherId,
        match.leaverId,
        match.probabilisticSpotId,
        match.matchType,
        match.spotLatitude,
        match.spotLongitude,
        match.status,
        match.searcherChargeAmount,
        match.leaverRewardAmount,
        match.platformFeeAmount,
        match.handshakeTimeoutSeconds,
        match.offeredAt,
        match.acceptedAt,
        match.arrivedAt,
        match.completedAt,
        match.cancelledAt,
        match.cancellationReason,
      ],
    );
    return match;
  }

  async findById(id: string): Promise<MatchEntity | null> {
    if (!this.pool) return null;
    const res = await this.pool.query('SELECT * FROM matches WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    return this.mapToEntity(res.rows[0]);
  }

  async update(match: MatchEntity): Promise<MatchEntity> {
    if (!this.pool) return match;
    await this.pool.query(
      `UPDATE matches SET
        status = $2,
        accepted_at = $3,
        arrived_at = $4,
        completed_at = $5,
        cancelled_at = $6,
        cancellation_reason = $7
       WHERE id = $1`,
      [
        match.id,
        match.status,
        match.acceptedAt,
        match.arrivedAt,
        match.completedAt,
        match.cancelledAt,
        match.cancellationReason,
      ],
    );
    return match;
  }

  async updateStatus(id: string, status: MatchStatus): Promise<void> {
    if (!this.pool) return;
    await this.pool.query('UPDATE matches SET status = $2 WHERE id = $1', [id, status]);
  }

  async findActiveMatchByUserId(userId: string): Promise<MatchEntity | null> {
    if (!this.pool) return null;
    const res = await this.pool.query(
      `SELECT * FROM matches 
       WHERE (searcher_id = $1 OR leaver_id = $1)
         AND status IN ('OFFERED', 'ACCEPTED', 'EN_ROUTE', 'ARRIVED')
       ORDER BY offered_at DESC
       LIMIT 1`,
      [userId],
    );
    if (res.rows.length === 0) return null;
    return this.mapToEntity(res.rows[0]);
  }

  private mapToEntity(row: any): MatchEntity {
    return new MatchEntity({
      id: row.id,
      searcherId: row.searcher_id,
      leaverId: row.leaver_id,
      probabilisticSpotId: row.probabilistic_spot_id,
      matchType: row.match_type as MatchType,
      spotLatitude: parseFloat(row.spot_latitude),
      spotLongitude: parseFloat(row.spot_longitude),
      status: row.status as MatchStatus,
      searcherChargeAmount: parseFloat(row.searcher_charge_amount),
      leaverRewardAmount: parseFloat(row.leaver_reward_amount),
      platformFeeAmount: parseFloat(row.platform_fee_amount),
      handshakeTimeoutSeconds: parseInt(row.handshake_timeout_seconds, 10),
      offeredAt: new Date(row.offered_at),
      acceptedAt: row.accepted_at ? new Date(row.accepted_at) : null,
      arrivedAt: row.arrived_at ? new Date(row.arrived_at) : null,
      completedAt: row.completed_at ? new Date(row.completed_at) : null,
      cancelledAt: row.cancelled_at ? new Date(row.cancelled_at) : null,
      cancellationReason: row.cancellation_reason,
    });
  }
}
