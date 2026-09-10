import { Injectable, Optional } from '@nestjs/common';
import { Pool } from 'pg';
import { getSharedPostgresPool } from '../../../../database/postgres-pool.helper';
import { IVehicleRepositoryPort } from '../../domain/ports/vehicle-repository.port';
import { UserVehicleEntity } from '../../domain/entities/user-vehicle.entity';

@Injectable()
export class PostgresVehicleRepository implements IVehicleRepositoryPort {
  private pool: Pool | null = null;

  constructor(@Optional() pool?: Pool) {
    if (pool) {
      this.pool = pool;
    } else {
      this.pool = getSharedPostgresPool();
    }
  }

  async findById(id: string): Promise<UserVehicleEntity | null> {
    if (!this.pool) return null;
    const res = await this.pool.query('SELECT * FROM user_vehicles WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    return this.mapToEntity(res.rows[0]);
  }

  async findByUserId(userId: string): Promise<UserVehicleEntity[]> {
    if (!this.pool) return [];
    const res = await this.pool.query('SELECT * FROM user_vehicles WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    return res.rows.map((row) => this.mapToEntity(row));
  }

  async create(vehicle: UserVehicleEntity): Promise<UserVehicleEntity> {
    if (!this.pool) return vehicle;
    if (vehicle.isDefault) {
      await this.clearDefaults(vehicle.userId);
    }
    await this.pool.query(
      `INSERT INTO user_vehicles (id, user_id, make_model, color, plate_suffix, is_default, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        vehicle.id,
        vehicle.userId,
        vehicle.makeModel,
        vehicle.color,
        vehicle.plateSuffix,
        vehicle.isDefault,
        vehicle.createdAt,
        vehicle.updatedAt,
      ],
    );
    return vehicle;
  }

  async update(vehicle: UserVehicleEntity): Promise<UserVehicleEntity> {
    if (!this.pool) return vehicle;
    if (vehicle.isDefault) {
      await this.clearDefaults(vehicle.userId);
    }
    await this.pool.query(
      `UPDATE user_vehicles SET 
        make_model = $2,
        color = $3,
        plate_suffix = $4,
        is_default = $5,
        updated_at = $6
       WHERE id = $1`,
      [
        vehicle.id,
        vehicle.makeModel,
        vehicle.color,
        vehicle.plateSuffix,
        vehicle.isDefault,
        vehicle.updatedAt,
      ],
    );
    return vehicle;
  }

  async delete(id: string): Promise<boolean> {
    if (!this.pool) return true;
    const res = await this.pool.query('DELETE FROM user_vehicles WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }

  async clearDefaults(userId: string): Promise<void> {
    if (!this.pool) return;
    await this.pool.query('UPDATE user_vehicles SET is_default = FALSE WHERE user_id = $1', [userId]);
  }

  private mapToEntity(row: any): UserVehicleEntity {
    return new UserVehicleEntity({
      id: row.id,
      userId: row.user_id,
      makeModel: row.make_model,
      color: row.color,
      plateSuffix: row.plate_suffix,
      isDefault: row.is_default,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
