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
exports.PostgresWalletRepository = void 0;
const common_1 = require("@nestjs/common");
const pg_1 = require("pg");
const wallet_entity_1 = require("../../domain/entities/wallet.entity");
const ledger_transaction_entity_1 = require("../../domain/entities/ledger-transaction.entity");
let PostgresWalletRepository = class PostgresWalletRepository {
    constructor(pool) {
        this.pool = null;
        if (pool) {
            this.pool = pool;
        }
        else if (process.env.DATABASE_URL) {
            const isSupabase = process.env.DATABASE_URL.includes('supabase') || process.env.DATABASE_SSL === 'true';
            const connectionString = process.env.DATABASE_URL.replace('?sslmode=require', '').replace('&sslmode=require', '');
            this.pool = new pg_1.Pool({
                connectionString,
                ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
            });
        }
    }
    async findByUserId(userId) {
        if (!this.pool)
            return null;
        const res = await this.pool.query('SELECT * FROM user_wallets WHERE user_id = $1', [userId]);
        if (res.rows.length === 0)
            return null;
        return this.mapToWalletEntity(res.rows[0]);
    }
    async findById(walletId) {
        if (!this.pool)
            return null;
        const res = await this.pool.query('SELECT * FROM user_wallets WHERE id = $1', [walletId]);
        if (res.rows.length === 0)
            return null;
        return this.mapToWalletEntity(res.rows[0]);
    }
    async createWallet(wallet) {
        if (!this.pool)
            return wallet;
        await this.pool.query(`INSERT INTO user_wallets (id, user_id, balance, locked_balance, currency, version, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
            wallet.id,
            wallet.userId,
            wallet.balance,
            wallet.lockedBalance,
            wallet.currency,
            wallet.version,
            wallet.updatedAt,
        ]);
        return wallet;
    }
    async updateWallet(wallet) {
        if (!this.pool)
            return wallet;
        await this.pool.query(`UPDATE user_wallets SET 
        balance = $2,
        locked_balance = $3,
        currency = $4,
        version = $5,
        updated_at = $6
       WHERE id = $1`, [
            wallet.id,
            wallet.balance,
            wallet.lockedBalance,
            wallet.currency,
            wallet.version,
            wallet.updatedAt,
        ]);
        return wallet;
    }
    async recordLedgerEntry(tx) {
        if (!this.pool)
            return tx;
        await this.pool.query(`INSERT INTO wallet_ledger_transactions (id, wallet_id, match_id, idempotency_key, transaction_type, amount, balance_after, status, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`, [
            tx.id,
            tx.walletId,
            tx.matchId,
            tx.idempotencyKey,
            tx.transactionType,
            tx.amount,
            tx.balanceAfter,
            tx.status,
            JSON.stringify(tx.metadata),
            tx.createdAt,
        ]);
        return tx;
    }
    async getLedgerEntryByIdempotencyKey(key) {
        if (!this.pool)
            return null;
        const res = await this.pool.query('SELECT * FROM wallet_ledger_transactions WHERE idempotency_key = $1', [key]);
        if (res.rows.length === 0)
            return null;
        return this.mapToLedgerEntity(res.rows[0]);
    }
    async getTransactionHistory(walletId, page = 1, limit = 20) {
        if (!this.pool)
            return { transactions: [], total: 0 };
        const countRes = await this.pool.query('SELECT COUNT(*) FROM wallet_ledger_transactions WHERE wallet_id = $1', [walletId]);
        const total = parseInt(countRes.rows[0].count, 10);
        const offset = (page - 1) * limit;
        const res = await this.pool.query('SELECT * FROM wallet_ledger_transactions WHERE wallet_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3', [walletId, limit, offset]);
        return {
            transactions: res.rows.map((row) => this.mapToLedgerEntity(row)),
            total,
        };
    }
    mapToWalletEntity(row) {
        return new wallet_entity_1.WalletEntity({
            id: row.id,
            userId: row.user_id,
            balance: parseFloat(row.balance),
            lockedBalance: parseFloat(row.locked_balance),
            currency: row.currency,
            version: parseInt(row.version, 10),
            updatedAt: row.updated_at,
        });
    }
    mapToLedgerEntity(row) {
        return new ledger_transaction_entity_1.LedgerTransactionEntity({
            id: row.id,
            walletId: row.wallet_id,
            matchId: row.match_id,
            idempotencyKey: row.idempotency_key,
            transactionType: row.transaction_type,
            amount: parseFloat(row.amount),
            balanceAfter: parseFloat(row.balance_after),
            status: row.status,
            metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
            createdAt: row.created_at,
        });
    }
};
exports.PostgresWalletRepository = PostgresWalletRepository;
exports.PostgresWalletRepository = PostgresWalletRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [pg_1.Pool])
], PostgresWalletRepository);
//# sourceMappingURL=postgres-wallet.repository.js.map