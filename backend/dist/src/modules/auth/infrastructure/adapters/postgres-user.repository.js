"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgresUserRepository = void 0;
const common_1 = require("@nestjs/common");
const pg_1 = require("pg");
const postgres_pool_helper_1 = require("../../../../database/postgres-pool.helper");
const user_entity_1 = require("../../domain/entities/user.entity");
let PostgresUserRepository = class PostgresUserRepository {
    constructor(pool) {
        this.pool = null;
        if (pool) {
            this.pool = pool;
        }
        else {
            this.pool = (0, postgres_pool_helper_1.getSharedPostgresPool)();
        }
    }
    async findById(id) {
        if (!this.pool)
            return null;
        const res = await this.pool.query('SELECT * FROM users WHERE id = $1', [id]);
        if (res.rows.length === 0)
            return null;
        return this.mapToEntity(res.rows[0]);
    }
    async findByPhoneNumber(phone) {
        if (!this.pool)
            return null;
        const res = await this.pool.query('SELECT * FROM users WHERE phone_number = $1', [phone]);
        if (res.rows.length === 0)
            return null;
        return this.mapToEntity(res.rows[0]);
    }
    async findByEmail(email) {
        if (!this.pool)
            return null;
        const res = await this.pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
        if (res.rows.length === 0)
            return null;
        return this.mapToEntity(res.rows[0]);
    }
    async findByProvider(provider, providerId) {
        if (!this.pool)
            return null;
        const res = await this.pool.query('SELECT * FROM users WHERE auth_provider = $1 AND auth_provider_id = $2', [provider, providerId]);
        if (res.rows.length === 0)
            return null;
        return this.mapToEntity(res.rows[0]);
    }
    async create(user) {
        if (!this.pool)
            return user;
        await this.pool.query(`INSERT INTO users (id, phone_number, email, full_name, auth_provider, auth_provider_id, avatar_url, reliability_rating, total_completed_matches, total_disputes_count, is_active, password_hash, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`, [
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
        ]);
        return user;
    }
    async update(user) {
        if (!this.pool)
            return user;
        await this.pool.query(`UPDATE users SET 
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
       WHERE id = $1`, [
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
        ]);
        return user;
    }
    mapToEntity(row) {
        return new user_entity_1.UserEntity({
            id: row.id,
            phoneNumber: row.phone_number,
            email: row.email,
            fullName: row.full_name,
            authProvider: row.auth_provider,
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
};
exports.PostgresUserRepository = PostgresUserRepository;
exports.PostgresUserRepository = PostgresUserRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [pg_1.Pool])
], PostgresUserRepository);
//# sourceMappingURL=postgres-user.repository.js.map