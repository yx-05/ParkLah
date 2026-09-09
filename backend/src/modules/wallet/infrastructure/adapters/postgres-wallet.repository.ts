import { Injectable, Optional } from '@nestjs/common';
import { Pool } from 'pg';
import { getSharedPostgresPool } from '../../../../database/postgres-pool.helper';
import { IWalletRepositoryPort } from '../../domain/ports/wallet-repository.port';
import { WalletEntity } from '../../domain/entities/wallet.entity';
import { LedgerTransactionEntity, TransactionType, TransactionStatus } from '../../domain/entities/ledger-transaction.entity';

@Injectable()
export class PostgresWalletRepository implements IWalletRepositoryPort {
  private pool: Pool | null = null;

  constructor(@Optional() pool?: Pool) {
    if (pool) {
      this.pool = pool;
    } else {
      this.pool = getSharedPostgresPool();
    }
  }

  async findByUserId(userId: string): Promise<WalletEntity | null> {
    if (!this.pool) return null;
    const res = await this.pool.query('SELECT * FROM user_wallets WHERE user_id = $1', [userId]);
    if (res.rows.length === 0) return null;
    return this.mapToWalletEntity(res.rows[0]);
  }

  async findById(walletId: string): Promise<WalletEntity | null> {
    if (!this.pool) return null;
    const res = await this.pool.query('SELECT * FROM user_wallets WHERE id = $1', [walletId]);
    if (res.rows.length === 0) return null;
    return this.mapToWalletEntity(res.rows[0]);
  }

  async createWallet(wallet: WalletEntity): Promise<WalletEntity> {
    if (!this.pool) return wallet;
    await this.pool.query(
      `INSERT INTO user_wallets (id, user_id, balance, locked_balance, currency, version, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        wallet.id,
        wallet.userId,
        wallet.balance,
        wallet.lockedBalance,
        wallet.currency,
        wallet.version,
        wallet.updatedAt,
      ],
    );
    return wallet;
  }

  async updateWallet(wallet: WalletEntity): Promise<WalletEntity> {
    if (!this.pool) return wallet;
    await this.pool.query(
      `UPDATE user_wallets SET 
        balance = $2,
        locked_balance = $3,
        currency = $4,
        version = $5,
        updated_at = $6
       WHERE id = $1`,
      [
        wallet.id,
        wallet.balance,
        wallet.lockedBalance,
        wallet.currency,
        wallet.version,
        wallet.updatedAt,
      ],
    );
    return wallet;
  }

  async recordLedgerEntry(tx: LedgerTransactionEntity): Promise<LedgerTransactionEntity> {
    if (!this.pool) return tx;
    await this.pool.query(
      `INSERT INTO wallet_ledger_transactions (id, wallet_id, match_id, idempotency_key, transaction_type, amount, balance_after, status, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
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
      ],
    );
    return tx;
  }

  async getLedgerEntryByIdempotencyKey(key: string): Promise<LedgerTransactionEntity | null> {
    if (!this.pool) return null;
    const res = await this.pool.query(
      'SELECT * FROM wallet_ledger_transactions WHERE idempotency_key = $1',
      [key],
    );
    if (res.rows.length === 0) return null;
    return this.mapToLedgerEntity(res.rows[0]);
  }

  async getTransactionHistory(
    walletId: string,
    page = 1,
    limit = 20,
  ): Promise<{ transactions: LedgerTransactionEntity[]; total: number }> {
    if (!this.pool) return { transactions: [], total: 0 };
    const countRes = await this.pool.query(
      'SELECT COUNT(*) FROM wallet_ledger_transactions WHERE wallet_id = $1',
      [walletId],
    );
    const total = parseInt(countRes.rows[0].count, 10);

    const offset = (page - 1) * limit;
    const res = await this.pool.query(
      'SELECT * FROM wallet_ledger_transactions WHERE wallet_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [walletId, limit, offset],
    );

    return {
      transactions: res.rows.map((row) => this.mapToLedgerEntity(row)),
      total,
    };
  }

  private mapToWalletEntity(row: any): WalletEntity {
    return new WalletEntity({
      id: row.id,
      userId: row.user_id,
      balance: parseFloat(row.balance),
      lockedBalance: parseFloat(row.locked_balance),
      currency: row.currency,
      version: parseInt(row.version, 10),
      updatedAt: row.updated_at,
    });
  }

  private mapToLedgerEntity(row: any): LedgerTransactionEntity {
    return new LedgerTransactionEntity({
      id: row.id,
      walletId: row.wallet_id,
      matchId: row.match_id,
      idempotencyKey: row.idempotency_key,
      transactionType: row.transaction_type as TransactionType,
      amount: parseFloat(row.amount),
      balanceAfter: parseFloat(row.balance_after),
      status: row.status as TransactionStatus,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
      createdAt: row.created_at,
    });
  }
}
