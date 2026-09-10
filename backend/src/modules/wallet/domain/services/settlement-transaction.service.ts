import { Injectable, Inject } from '@nestjs/common';
import { IWalletRepositoryPort, WALLET_REPOSITORY_PORT } from '../ports/wallet-repository.port';
import { WalletEntity } from '../entities/wallet.entity';
import { LedgerTransactionEntity } from '../entities/ledger-transaction.entity';
import { InsufficientWalletBalanceException } from '../../../../common/exceptions';

export interface SettlementResult {
  success: boolean;
  matchId: string;
  searcherDebit: number;
  leaverCredit: number;
  platformFee: number;
  searcherBalanceAfter: number;
  leaverBalanceAfter: number;
  settledAt: Date;
}

@Injectable()
export class SettlementTransactionService {
  constructor(
    @Inject(WALLET_REPOSITORY_PORT)
    private readonly walletRepository: IWalletRepositoryPort,
  ) {}

  async executeHandoffSettlement(
    searcherId: string,
    leaverId: string,
    matchId: string,
  ): Promise<SettlementResult> {
    const searcherDebitKey = `match:${matchId}:searcher:debit`;
    const leaverCreditKey = `match:${matchId}:leaver:credit`;

    // Check idempotency first
    const existingDebit = await this.walletRepository.getLedgerEntryByIdempotencyKey(searcherDebitKey);
    if (existingDebit) {
      throw new Error(`Match settlement for match ${matchId} has already been executed`);
    }

    // 1. Get or create searcher wallet
    let searcherWallet = await this.walletRepository.findByUserId(searcherId);
    if (!searcherWallet) {
      searcherWallet = await this.walletRepository.createWallet(
        new WalletEntity({ userId: searcherId, balance: 20.0 }),
      );
    }

    // 2. Check searcher balance
    const searcherCharge = 0.50;
    if (searcherWallet.balance < searcherCharge) {
      throw new InsufficientWalletBalanceException(
        `Insufficient balance for matchmaker fee. Required: RM 0.50, Current: RM ${searcherWallet.balance.toFixed(2)}`,
      );
    }

    // 3. Get or create leaver wallet
    let leaverWallet = await this.walletRepository.findByUserId(leaverId);
    if (!leaverWallet) {
      leaverWallet = await this.walletRepository.createWallet(
        new WalletEntity({ userId: leaverId, balance: 20.0 }),
      );
    }

    const leaverReward = 0.25;
    const platformFee = 0.25;

    // 4. Mutate balances
    searcherWallet.debit(searcherCharge);
    leaverWallet.credit(leaverReward);

    await this.walletRepository.updateWallet(searcherWallet);
    await this.walletRepository.updateWallet(leaverWallet);

    // 5. Record double-entry ledger transactions
    await this.walletRepository.recordLedgerEntry(
      new LedgerTransactionEntity({
        walletId: searcherWallet.id,
        matchId,
        idempotencyKey: searcherDebitKey,
        transactionType: 'SEARCHER_HANDOFF_FEE',
        amount: -searcherCharge,
        balanceAfter: searcherWallet.balance,
        status: 'COMPLETED',
        metadata: { counterpartyId: leaverId, matchId },
      }),
    );

    await this.walletRepository.recordLedgerEntry(
      new LedgerTransactionEntity({
        walletId: leaverWallet.id,
        matchId,
        idempotencyKey: leaverCreditKey,
        transactionType: 'LEAVER_HANDOFF_REWARD',
        amount: leaverReward,
        balanceAfter: leaverWallet.balance,
        status: 'COMPLETED',
        metadata: { counterpartyId: searcherId, matchId },
      }),
    );

    return {
      success: true,
      matchId,
      searcherDebit: searcherCharge,
      leaverCredit: leaverReward,
      platformFee,
      searcherBalanceAfter: searcherWallet.balance,
      leaverBalanceAfter: leaverWallet.balance,
      settledAt: new Date(),
    };
  }
}
