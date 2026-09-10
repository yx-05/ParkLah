import { Injectable, Optional } from '@nestjs/common';
import { Pool } from 'pg';
import { getSharedPostgresPool } from '../../../../database/postgres-pool.helper';
import {
  IMlFeatureRepositoryPort,
  MlMatchFeatureRecord,
} from '../../domain/ports/ml-feature-repository.port';

@Injectable()
export class PostgresMlFeatureRepository implements IMlFeatureRepositoryPort {
  private pool: Pool | null = null;

  constructor(@Optional() pool?: Pool) {
    if (pool) {
      this.pool = pool;
    } else {
      this.pool = getSharedPostgresPool();
    }
  }

  async saveFeatureSnapshot(record: MlMatchFeatureRecord): Promise<MlMatchFeatureRecord> {
    if (!this.pool) return record;

    const query = `
      INSERT INTO ml_match_features (
        match_id, searcher_id, leaver_id, spot_latitude, spot_longitude,
        predicted_probability, dispatch_rank, model_version, feature_payload,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING id, created_at;
    `;

    const values = [
      record.matchId || null,
      record.searcherId,
      record.leaverId || null,
      record.spotLatitude,
      record.spotLongitude,
      record.predictedProbability,
      record.dispatchRank,
      record.modelVersion || 'lightgbm_v1_synthetic',
      JSON.stringify(record.featurePayload),
    ];

    const result = await this.pool.query(query, values);
    if (result.rows.length > 0) {
      record.id = result.rows[0].id;
      record.createdAt = result.rows[0].created_at;
    }

    return record;
  }

  async updateOutcome(
    matchId: string,
    outcome: 0 | 1,
    reason: string,
    settledAt: Date = new Date(),
  ): Promise<boolean> {
    if (!this.pool) return true;

    const query = `
      UPDATE ml_match_features
      SET ground_truth_outcome = $1,
          outcome_reason = $2,
          settled_at = $3
      WHERE match_id = $4;
    `;

    const result = await this.pool.query(query, [outcome, reason, settledAt, matchId]);
    return (result.rowCount ?? 0) > 0;
  }

  async findRecentFeatures(limit = 100): Promise<MlMatchFeatureRecord[]> {
    if (!this.pool) return [];

    const query = `
      SELECT * FROM ml_match_features
      ORDER BY created_at DESC
      LIMIT $1;
    `;

    const result = await this.pool.query(query, [limit]);
    return result.rows.map((row) => ({
      id: row.id,
      matchId: row.match_id,
      searcherId: row.searcher_id,
      leaverId: row.leaver_id,
      spotLatitude: parseFloat(row.spot_latitude),
      spotLongitude: parseFloat(row.spot_longitude),
      predictedProbability: parseFloat(row.predicted_probability),
      dispatchRank: row.dispatch_rank,
      modelVersion: row.model_version,
      featurePayload: typeof row.feature_payload === 'string' ? JSON.parse(row.feature_payload) : row.feature_payload,
      groundTruthOutcome: row.ground_truth_outcome,
      outcomeReason: row.outcome_reason,
      createdAt: row.created_at,
      settledAt: row.settled_at,
    }));
  }
}
