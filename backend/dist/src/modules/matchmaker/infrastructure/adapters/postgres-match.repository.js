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
exports.PostgresMatchRepository = void 0;
const common_1 = require("@nestjs/common");
const pg_1 = require("pg");
const postgres_pool_helper_1 = require("../../../../database/postgres-pool.helper");
const match_entity_1 = require("../../domain/entities/match.entity");
let PostgresMatchRepository = class PostgresMatchRepository {
    constructor(pool) {
        this.pool = null;
        if (pool) {
            this.pool = pool;
        }
        else {
            this.pool = (0, postgres_pool_helper_1.getSharedPostgresPool)();
        }
    }
    async createMatch(match) {
        if (!this.pool)
            return match;
        await this.pool.query(`INSERT INTO matches (
        id, searcher_id, leaver_id, probabilistic_spot_id, match_type, spot_geom,
        spot_latitude, spot_longitude, status, searcher_charge_amount, leaver_reward_amount,
        platform_fee_amount, handshake_timeout_seconds, offered_at, accepted_at,
        arrived_at, completed_at, cancelled_at, cancellation_reason
      ) VALUES (
        $1, $2, $3, $4, $5, ST_SetSRID(ST_MakePoint($7, $6), 4326),
        $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
      )`, [
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
        ]);
        return match;
    }
    async findById(id) {
        if (!this.pool)
            return null;
        const res = await this.pool.query('SELECT * FROM matches WHERE id = $1', [id]);
        if (res.rows.length === 0)
            return null;
        return this.mapToEntity(res.rows[0]);
    }
    async update(match) {
        if (!this.pool)
            return match;
        await this.pool.query(`UPDATE matches SET
        status = $2,
        accepted_at = $3,
        arrived_at = $4,
        completed_at = $5,
        cancelled_at = $6,
        cancellation_reason = $7
       WHERE id = $1`, [
            match.id,
            match.status,
            match.acceptedAt,
            match.arrivedAt,
            match.completedAt,
            match.cancelledAt,
            match.cancellationReason,
        ]);
        return match;
    }
    async updateStatus(id, status) {
        if (!this.pool)
            return;
        await this.pool.query('UPDATE matches SET status = $2 WHERE id = $1', [id, status]);
    }
    async findActiveMatchByUserId(userId) {
        if (!this.pool)
            return null;
        const res = await this.pool.query(`SELECT * FROM matches 
       WHERE (searcher_id = $1 OR leaver_id = $1)
         AND status IN ('OFFERED', 'ACCEPTED', 'EN_ROUTE', 'ARRIVED')
       ORDER BY offered_at DESC
       LIMIT 1`, [userId]);
        if (res.rows.length === 0)
            return null;
        return this.mapToEntity(res.rows[0]);
    }
    mapToEntity(row) {
        return new match_entity_1.MatchEntity({
            id: row.id,
            searcherId: row.searcher_id,
            leaverId: row.leaver_id,
            probabilisticSpotId: row.probabilistic_spot_id,
            matchType: row.match_type,
            spotLatitude: parseFloat(row.spot_latitude),
            spotLongitude: parseFloat(row.spot_longitude),
            status: row.status,
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
};
exports.PostgresMatchRepository = PostgresMatchRepository;
exports.PostgresMatchRepository = PostgresMatchRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [pg_1.Pool])
], PostgresMatchRepository);
//# sourceMappingURL=postgres-match.repository.js.map