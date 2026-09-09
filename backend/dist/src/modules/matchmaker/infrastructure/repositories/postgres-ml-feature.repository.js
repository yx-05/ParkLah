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
exports.PostgresMlFeatureRepository = void 0;
const common_1 = require("@nestjs/common");
const pg_1 = require("pg");
const postgres_pool_helper_1 = require("../../../../database/postgres-pool.helper");
let PostgresMlFeatureRepository = class PostgresMlFeatureRepository {
    constructor(pool) {
        this.pool = null;
        if (pool) {
            this.pool = pool;
        }
        else {
            this.pool = (0, postgres_pool_helper_1.getSharedPostgresPool)();
        }
    }
    async saveFeatureSnapshot(record) {
        if (!this.pool)
            return record;
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
    async updateOutcome(matchId, outcome, reason, settledAt = new Date()) {
        if (!this.pool)
            return true;
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
    async findRecentFeatures(limit = 100) {
        if (!this.pool)
            return [];
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
};
exports.PostgresMlFeatureRepository = PostgresMlFeatureRepository;
exports.PostgresMlFeatureRepository = PostgresMlFeatureRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [pg_1.Pool])
], PostgresMlFeatureRepository);
//# sourceMappingURL=postgres-ml-feature.repository.js.map