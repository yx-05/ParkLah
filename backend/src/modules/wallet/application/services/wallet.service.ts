import { Injectable, Inject } from '@nestjs/common';
import { IWalletRepositoryPort, WALLET_REPOSITORY_PORT } from '../../domain/ports/wallet-repository.port';
import { SettlementTransactionService, SettlementResult } from '../../domain/services/settlement-transaction.service';
import { MockWalletService } from './mock-wallet.service';
import { WalletEntity } from '../../domain/entities/wallet.entity';
import { TopUpDto, CashOutDto } from '../dto';

export interface WalletBalanceResponse {
  userId: string;
  balance: number;
  formattedBalance: string;
  lockedBalance: number;
  currency: string;
  updatedAt: Date;
}

@Injectable()
export class WalletService {
  constructor(
    @Inject(WALLET_REPOSITORY_PORT)
    private readonly walletRepository: IWalletRepositoryPort,
    private readonly settlementService: SettlementTransactionService,
    private readonly mockWalletService: MockWalletService,
  ) {}

  async getBalance(userId: string): Promise<WalletBalanceResponse> {
    let wallet = await this.walletRepository.findByUserId(userId);
    if (!wallet) {
      wallet = await this.walletRepository.createWallet(
        new WalletEntity({ userId, balance: 20.0 }),
      );
    }

    return {
      userId: wallet.userId,
      balance: wallet.balance,
      formattedBalance: wallet.getFormattedBalance(),
      lockedBalance: wallet.lockedBalance,
      currency: wallet.currency,
      updatedAt: wallet.updatedAt,
    };
  }

  async executeHandoffSettlement(
    searcherId: string,
    leaverId: string,
    matchId: string,
  ): Promise<SettlementResult> {
    return this.settlementService.executeHandoffSettlement(searcherId, leaverId, matchId);
  }

  async topUp(userId: string, dto: TopUpDto) {
    const { wallet, transaction } = await this.mockWalletService.mockTopUp(userId, dto.amount);
    return {
      balance: wallet.balance,
      formattedBalance: wallet.getFormattedBalance(),
      transaction: {
        id: transaction.id,
        idempotencyKey: transaction.idempotencyKey,
        amount: transaction.amount,
        type: transaction.transactionType,
        createdAt: transaction.createdAt,
      },
    };
  }

  async cashOut(userId: string, dto: CashOutDto) {
    const { wallet, transaction } = await this.mockWalletService.mockCashOut(userId, dto.amount);
    return {
      balance: wallet.balance,
      formattedBalance: wallet.getFormattedBalance(),
      transaction: {
        id: transaction.id,
        idempotencyKey: transaction.idempotencyKey,
        amount: transaction.amount,
        type: transaction.transactionType,
        createdAt: transaction.createdAt,
      },
    };
  }

  async getTransactions(userId: string, page = 1, limit = 20) {
    let wallet = await this.walletRepository.findByUserId(userId);
    if (!wallet) {
      wallet = await this.walletRepository.createWallet(
        new WalletEntity({ userId, balance: 20.0 }),
      );
    }

    const { transactions, total } = await this.walletRepository.getTransactionHistory(
      wallet.id,
      page,
      limit,
    );

    return {
      transactions: transactions.map((t) => ({
        id: t.id,
        matchId: t.matchId,
        idempotencyKey: t.idempotencyKey,
        type: t.transactionType,
        amount: t.amount,
        balanceAfter: t.balanceAfter,
        status: t.status,
        createdAt: t.createdAt,
      })),
      total,
      page,
      limit,
    };
  }
}
