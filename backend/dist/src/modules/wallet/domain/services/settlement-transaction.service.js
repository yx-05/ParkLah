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
exports.SettlementTransactionService = void 0;
const common_1 = require("@nestjs/common");
const wallet_repository_port_1 = require("../ports/wallet-repository.port");
const wallet_entity_1 = require("../entities/wallet.entity");
const ledger_transaction_entity_1 = require("../entities/ledger-transaction.entity");
const exceptions_1 = require("../../../../common/exceptions");
let SettlementTransactionService = class SettlementTransactionService {
    constructor(walletRepository) {
        this.walletRepository = walletRepository;
    }
    async executeHandoffSettlement(searcherId, leaverId, matchId) {
        const searcherDebitKey = `match:${matchId}:searcher:debit`;
        const leaverCreditKey = `match:${matchId}:leaver:credit`;
        const existingDebit = await this.walletRepository.getLedgerEntryByIdempotencyKey(searcherDebitKey);
        if (existingDebit) {
            throw new Error(`Match settlement for match ${matchId} has already been executed`);
        }
        let searcherWallet = await this.walletRepository.findByUserId(searcherId);
        if (!searcherWallet) {
            searcherWallet = await this.walletRepository.createWallet(new wallet_entity_1.WalletEntity({ userId: searcherId, balance: 20.0 }));
        }
        const searcherCharge = 0.50;
        if (searcherWallet.balance < searcherCharge) {
            throw new exceptions_1.InsufficientWalletBalanceException(`Insufficient balance for matchmaker fee. Required: RM 0.50, Current: RM ${searcherWallet.balance.toFixed(2)}`);
        }
        let leaverWallet = await this.walletRepository.findByUserId(leaverId);
        if (!leaverWallet) {
            leaverWallet = await this.walletRepository.createWallet(new wallet_entity_1.WalletEntity({ userId: leaverId, balance: 20.0 }));
        }
        const leaverReward = 0.25;
        const platformFee = 0.25;
        searcherWallet.debit(searcherCharge);
        leaverWallet.credit(leaverReward);
        await this.walletRepository.updateWallet(searcherWallet);
        await this.walletRepository.updateWallet(leaverWallet);
        await this.walletRepository.recordLedgerEntry(new ledger_transaction_entity_1.LedgerTransactionEntity({
            walletId: searcherWallet.id,
            matchId,
            idempotencyKey: searcherDebitKey,
            transactionType: 'SEARCHER_HANDOFF_FEE',
            amount: -searcherCharge,
            balanceAfter: searcherWallet.balance,
            status: 'COMPLETED',
            metadata: { counterpartyId: leaverId, matchId },
        }));
        await this.walletRepository.recordLedgerEntry(new ledger_transaction_entity_1.LedgerTransactionEntity({
            walletId: leaverWallet.id,
            matchId,
            idempotencyKey: leaverCreditKey,
            transactionType: 'LEAVER_HANDOFF_REWARD',
            amount: leaverReward,
            balanceAfter: leaverWallet.balance,
            status: 'COMPLETED',
            metadata: { counterpartyId: searcherId, matchId },
        }));
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
};
exports.SettlementTransactionService = SettlementTransactionService;
exports.SettlementTransactionService = SettlementTransactionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(wallet_repository_port_1.WALLET_REPOSITORY_PORT)),
    __metadata("design:paramtypes", [Object])
], SettlementTransactionService);
//# sourceMappingURL=settlement-transaction.service.js.map