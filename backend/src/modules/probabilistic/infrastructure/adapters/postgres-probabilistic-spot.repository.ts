import { Injectable, Optional } from '@nestjs/common';
import { Pool } from 'pg';
import {
  IProbabilisticSpotRepositoryPort,
  CandidateSpotResult,
} from '../../domain/ports/probabilistic-spot-repository.port';
import { ProbabilisticSpotEntity } from '../../domain/entities/probabilistic-spot.entity';
import { SpotStatus } from '../../domain/enums/spot-status.enum';

@Injectable()
export class PostgresProbabilisticSpotRepository implements IProbabilisticSpotRepositoryPort {
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

  async create(spot: ProbabilisticSpotEntity): Promise<ProbabilisticSpotEntity> {
    if (!this.pool) return spot;
    await this.pool.query(
      `INSERT INTO probabilistic_spots (
        id, leaver_id, location_geom, latitude, longitude, initial_p, current_p, area_traffic_multiplier, landmark_note, status, vacated_at, expires_at, created_at, updated_at
      ) VALUES (
        $1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), $4, $3, $5, $6, $7, $8, $9, $10, $11, $12, $13
      )`,
      [
        spot.id,
        spot.leaverId,
        spot.longitude,
        spot.latitude,
        spot.initialP,
        spot.currentP,
        spot.areaTrafficMultiplier,
        spot.landmarkNote,
        spot.status,
        spot.vacatedAt,
        spot.expiresAt,
        spot.createdAt,
        spot.updatedAt,
      ],
    );
    return spot;
  }

  async findById(id: string): Promise<ProbabilisticSpotEntity | null> {
    if (!this.pool) return null;
    const res = await this.pool.query('SELECT * FROM probabilistic_spots WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    return this.mapToEntity(res.rows[0]);
  }

  async findAllAvailable(): Promise<ProbabilisticSpotEntity[]> {
    if (!this.pool) return [];
    const res = await this.pool.query(
      "SELECT * FROM probabilistic_spots WHERE status = 'AVAILABLE' ORDER BY created_at DESC",
    );
    return res.rows.map((r) => this.mapToEntity(r));
  }

  async findActiveWithinRadius(
    latitude: number,
    longitude: number,
    radiusMeters = 500,
    limit = 3,
  ): Promise<CandidateSpotResult[]> {
    if (!this.pool) return [];
    const query = `
      SELECT *, 
        ST_Distance(location_geom::geography, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography) AS distance_meters
      FROM probabilistic_spots
      WHERE status = 'AVAILABLE' 
        AND current_p >= 0.150
        AND ST_DWithin(
          location_geom::geography, 
          ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography, 
          $3
        )
      ORDER BY current_p DESC, distance_meters ASC
      LIMIT $4
    `;

    const res = await this.pool.query(query, [latitude, longitude, radiusMeters, limit]);
    return res.rows.map((row) => ({
      spot: this.mapToEntity(row),
      distanceMeters: Math.round(parseFloat(row.distance_meters)),
    }));
  }

  async update(spot: ProbabilisticSpotEntity): Promise<ProbabilisticSpotEntity> {
    if (!this.pool) return spot;
    await this.pool.query(
      `UPDATE probabilistic_spots SET
        current_p = $2,
        status = $3,
        updated_at = $4
       WHERE id = $1`,
      [spot.id, spot.currentP, spot.status, spot.updatedAt],
    );
    return spot;
  }

  async updateBatchProbabilities(
    updates: Array<{ id: string; currentP: number; status?: SpotStatus }>,
  ): Promise<void> {
    if (!this.pool || updates.length === 0) return;
    for (const u of updates) {
      await this.pool.query(
        'UPDATE probabilistic_spots SET current_p = $1, status = COALESCE($2, status), updated_at = NOW() WHERE id = $3',
        [u.currentP, u.status || null, u.id],
      );
    }
  }

  async expireSpotsBatch(cutoffTime: Date): Promise<number> {
    if (!this.pool) return 0;
    const res = await this.pool.query(
      `UPDATE probabilistic_spots 
       SET status = 'EXPIRED', current_p = 0.0, updated_at = NOW() 
       WHERE status = 'AVAILABLE' AND (expires_at < $1 OR current_p < 0.150)`,
      [cutoffTime],
    );
    return res.rowCount ?? 0;
  }

  private mapToEntity(row: any): ProbabilisticSpotEntity {
    return new ProbabilisticSpotEntity({
      id: row.id,
      leaverId: row.leaver_id,
      latitude: parseFloat(row.latitude),
      longitude: parseFloat(row.longitude),
      initialP: parseFloat(row.initial_p),
      currentP: parseFloat(row.current_p),
      areaTrafficMultiplier: parseFloat(row.area_traffic_multiplier),
      landmarkNote: row.landmark_note,
      status: row.status as SpotStatus,
      vacatedAt: row.vacated_at,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
