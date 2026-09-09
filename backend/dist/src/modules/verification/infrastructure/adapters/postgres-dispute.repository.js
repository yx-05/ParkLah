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
exports.PostgresDisputeRepository = void 0;
const common_1 = require("@nestjs/common");
const pg_1 = require("pg");
const postgres_pool_helper_1 = require("../../../../database/postgres-pool.helper");
const dispute_report_entity_1 = require("../../domain/entities/dispute-report.entity");
let PostgresDisputeRepository = class PostgresDisputeRepository {
    constructor(pool) {
        this.pool = null;
        if (pool) {
            this.pool = pool;
        }
        else {
            this.pool = (0, postgres_pool_helper_1.getSharedPostgresPool)();
        }
    }
    async createReport(report) {
        if (!this.pool)
            return report;
        await this.pool.query(`INSERT INTO dispute_reports (
        id, match_id, reporter_user_id, spot_id, dispute_type, description, status, created_at, resolved_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, [
            report.id,
            report.matchId,
            report.reporterUserId,
            report.spotId,
            report.disputeType,
            report.description,
            report.status,
            report.createdAt,
            report.resolvedAt,
        ]);
        return report;
    }
    async findById(id) {
        if (!this.pool)
            return null;
        const res = await this.pool.query('SELECT * FROM dispute_reports WHERE id = $1', [id]);
        if (res.rows.length === 0)
            return null;
        return this.mapToEntity(res.rows[0]);
    }
    async findByUserId(userId) {
        if (!this.pool)
            return [];
        const res = await this.pool.query('SELECT * FROM dispute_reports WHERE reporter_user_id = $1 ORDER BY created_at DESC', [userId]);
        return res.rows.map((r) => this.mapToEntity(r));
    }
    async update(report) {
        if (!this.pool)
            return report;
        await this.pool.query(`UPDATE dispute_reports SET
        status = $2,
        resolved_at = $3
       WHERE id = $1`, [report.id, report.status, report.resolvedAt]);
        return report;
    }
    mapToEntity(row) {
        return new dispute_report_entity_1.DisputeReportEntity({
            id: row.id,
            matchId: row.match_id,
            reporterUserId: row.reporter_user_id,
            spotId: row.spot_id,
            disputeType: row.dispute_type,
            description: row.description,
            status: row.status,
            createdAt: new Date(row.created_at),
            resolvedAt: row.resolved_at ? new Date(row.resolved_at) : null,
        });
    }
};
exports.PostgresDisputeRepository = PostgresDisputeRepository;
exports.PostgresDisputeRepository = PostgresDisputeRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [pg_1.Pool])
], PostgresDisputeRepository);
//# sourceMappingURL=postgres-dispute.repository.js.map