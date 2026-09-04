import { Injectable, Optional } from '@nestjs/common';
import { Pool } from 'pg';
import { IDisputeRepositoryPort } from '../../domain/ports/dispute-repository.port';
import { DisputeReportEntity } from '../../domain/entities/dispute-report.entity';
import { DisputeType, DisputeStatus } from '../../domain/enums/dispute-type.enum';

@Injectable()
export class PostgresDisputeRepository implements IDisputeRepositoryPort {
  private pool: Pool | null = null;

  constructor(@Optional() pool?: Pool) {
    if (pool) {
      this.pool = pool;
    } else if (process.env.DATABASE_URL) {
      const isSupabase = process.env.DATABASE_URL.includes('supabase') || process.env.DATABASE_SSL === 'true';
      const connectionString = process.env.DATABASE_URL.replace('?sslmode=require', '').replace('&sslmode=require', '');
      this.pool = new Pool({
        connectionString,
        ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
      });
    }
  }

  async createReport(report: DisputeReportEntity): Promise<DisputeReportEntity> {
    if (!this.pool) return report;
    await this.pool.query(
      `INSERT INTO dispute_reports (
        id, match_id, reporter_user_id, spot_id, dispute_type, description, status, created_at, resolved_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        report.id,
        report.matchId,
        report.reporterUserId,
        report.spotId,
        report.disputeType,
        report.description,
        report.status,
        report.createdAt,
        report.resolvedAt,
      ],
    );
    return report;
  }

  async findById(id: string): Promise<DisputeReportEntity | null> {
    if (!this.pool) return null;
    const res = await this.pool.query('SELECT * FROM dispute_reports WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    return this.mapToEntity(res.rows[0]);
  }

  async findByUserId(userId: string): Promise<DisputeReportEntity[]> {
    if (!this.pool) return [];
    const res = await this.pool.query(
      'SELECT * FROM dispute_reports WHERE reporter_user_id = $1 ORDER BY created_at DESC',
      [userId],
    );
    return res.rows.map((r) => this.mapToEntity(r));
  }

  async update(report: DisputeReportEntity): Promise<DisputeReportEntity> {
    if (!this.pool) return report;
    await this.pool.query(
      `UPDATE dispute_reports SET
        status = $2,
        resolved_at = $3
       WHERE id = $1`,
      [report.id, report.status, report.resolvedAt],
    );
    return report;
  }

  private mapToEntity(row: any): DisputeReportEntity {
    return new DisputeReportEntity({
      id: row.id,
      matchId: row.match_id,
      reporterUserId: row.reporter_user_id,
      spotId: row.spot_id,
      disputeType: row.dispute_type as DisputeType,
      description: row.description,
      status: row.status as DisputeStatus,
      createdAt: new Date(row.created_at),
      resolvedAt: row.resolved_at ? new Date(row.resolved_at) : null,
    });
  }
}
