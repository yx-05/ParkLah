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
exports.PostgresVehicleRepository = void 0;
const common_1 = require("@nestjs/common");
const pg_1 = require("pg");
const postgres_pool_helper_1 = require("../../../../database/postgres-pool.helper");
const user_vehicle_entity_1 = require("../../domain/entities/user-vehicle.entity");
let PostgresVehicleRepository = class PostgresVehicleRepository {
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
        const res = await this.pool.query('SELECT * FROM user_vehicles WHERE id = $1', [id]);
        if (res.rows.length === 0)
            return null;
        return this.mapToEntity(res.rows[0]);
    }
    async findByUserId(userId) {
        if (!this.pool)
            return [];
        const res = await this.pool.query('SELECT * FROM user_vehicles WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
        return res.rows.map((row) => this.mapToEntity(row));
    }
    async create(vehicle) {
        if (!this.pool)
            return vehicle;
        if (vehicle.isDefault) {
            await this.clearDefaults(vehicle.userId);
        }
        await this.pool.query(`INSERT INTO user_vehicles (id, user_id, make_model, color, plate_suffix, is_default, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [
            vehicle.id,
            vehicle.userId,
            vehicle.makeModel,
            vehicle.color,
            vehicle.plateSuffix,
            vehicle.isDefault,
            vehicle.createdAt,
            vehicle.updatedAt,
        ]);
        return vehicle;
    }
    async update(vehicle) {
        if (!this.pool)
            return vehicle;
        if (vehicle.isDefault) {
            await this.clearDefaults(vehicle.userId);
        }
        await this.pool.query(`UPDATE user_vehicles SET 
        make_model = $2,
        color = $3,
        plate_suffix = $4,
        is_default = $5,
        updated_at = $6
       WHERE id = $1`, [
            vehicle.id,
            vehicle.makeModel,
            vehicle.color,
            vehicle.plateSuffix,
            vehicle.isDefault,
            vehicle.updatedAt,
        ]);
        return vehicle;
    }
    async delete(id) {
        if (!this.pool)
            return true;
        const res = await this.pool.query('DELETE FROM user_vehicles WHERE id = $1', [id]);
        return (res.rowCount ?? 0) > 0;
    }
    async clearDefaults(userId) {
        if (!this.pool)
            return;
        await this.pool.query('UPDATE user_vehicles SET is_default = FALSE WHERE user_id = $1', [userId]);
    }
    mapToEntity(row) {
        return new user_vehicle_entity_1.UserVehicleEntity({
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
};
exports.PostgresVehicleRepository = PostgresVehicleRepository;
exports.PostgresVehicleRepository = PostgresVehicleRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [pg_1.Pool])
], PostgresVehicleRepository);
//# sourceMappingURL=postgres-vehicle.repository.js.map