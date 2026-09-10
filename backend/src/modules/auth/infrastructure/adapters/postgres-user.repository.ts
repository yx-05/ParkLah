import { Injectable, Optional } from '@nestjs/common';
import { Pool } from 'pg';
import { getSharedPostgresPool } from '../../../../database/postgres-pool.helper';
import { IUserRepositoryPort } from '../../domain/ports/user-repository.port';
import { UserEntity, AuthProvider } from '../../domain/entities/user.entity';

@Injectable()
export class PostgresUserRepository implements IUserRepositoryPort {
  private pool: Pool | null = null;

  constructor(@Optional() pool?: Pool) {
    if (pool) {
      this.pool = pool;
    } else {
      this.pool = getSharedPostgresPool();
    }
  }

  async findById(id: string): Promise<UserEntity | null> {
    if (!this.pool) return null;
    const res = await this.pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    return this.mapToEntity(res.rows[0]);
  }

  async findByPhoneNumber(phone: string): Promise<UserEntity | null> {
    if (!this.pool) return null;
    const res = await this.pool.query('SELECT * FROM users WHERE phone_number = $1', [phone]);
    if (res.rows.length === 0) return null;
    return this.mapToEntity(res.rows[0]);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    if (!this.pool) return null;
    const res = await this.pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (res.rows.length === 0) return null;
    return this.mapToEntity(res.rows[0]);
  }

  async findByProvider(provider: string, providerId: string): Promise<UserEntity | null> {
    if (!this.pool) return null;
    const res = await this.pool.query(
      'SELECT * FROM users WHERE auth_provider = $1 AND auth_provider_id = $2',
      [provider, providerId],
    );
    if (res.rows.length === 0) return null;
    return this.mapToEntity(res.rows[0]);
  }

  async create(user: UserEntity): Promise<UserEntity> {
    if (!this.pool) return user;
    await this.pool.query(
      `INSERT INTO users (id, phone_number, email, full_name, auth_provider, auth_provider_id, avatar_url, reliability_rating, total_completed_matches, total_disputes_count, is_active, password_hash, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        user.id,
        user.phoneNumber,
        user.email ? user.email.toLowerCase() : null,
        user.fullName,
        user.authProvider,
        user.authProviderId,
        user.avatarUrl,
        user.reliabilityRating,
        user.totalCompletedMatches,
        user.totalDisputesCount,
        user.isActive,
        user.passwordHash || null,
        user.createdAt,
        user.updatedAt,
      ],
    );
    return user;
  }

  async update(user: UserEntity): Promise<UserEntity> {
    if (!this.pool) return user;
    await this.pool.query(
      `UPDATE users SET 
        phone_number = $2,
        email = $3,
        full_name = $4,
        auth_provider = $5,
        auth_provider_id = $6,
        avatar_url = $7,
        reliability_rating = $8,
        total_completed_matches = $9,
        total_disputes_count = $10,
        is_active = $11,
        password_hash = $12,
        updated_at = $13
       WHERE id = $1`,
      [
        user.id,
        user.phoneNumber,
        user.email ? user.email.toLowerCase() : null,
        user.fullName,
        user.authProvider,
        user.authProviderId,
        user.avatarUrl,
        user.reliabilityRating,
        user.totalCompletedMatches,
        user.totalDisputesCount,
        user.isActive,
        user.passwordHash || null,
        user.updatedAt,
      ],
    );
    return user;
  }

  private mapToEntity(row: any): UserEntity {
    return new UserEntity({
      id: row.id,
      phoneNumber: row.phone_number,
      email: row.email,
      fullName: row.full_name,
      authProvider: row.auth_provider as AuthProvider,
      authProviderId: row.auth_provider_id,
      avatarUrl: row.avatar_url,
      passwordHash: row.password_hash || null,
      reliabilityRating: parseFloat(row.reliability_rating),
      totalCompletedMatches: parseInt(row.total_completed_matches, 10),
      totalDisputesCount: parseInt(row.total_disputes_count, 10),
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
