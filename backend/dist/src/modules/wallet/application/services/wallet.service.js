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
exports.WalletService = void 0;
const common_1 = require("@nestjs/common");
const wallet_repository_port_1 = require("../../domain/ports/wallet-repository.port");
const settlement_transaction_service_1 = require("../../domain/services/settlement-transaction.service");
const mock_wallet_service_1 = require("./mock-wallet.service");
const wallet_entity_1 = require("../../domain/entities/wallet.entity");
let WalletService = class WalletService {
    constructor(walletRepository, settlementService, mockWalletService) {
        this.walletRepository = walletRepository;
        this.settlementService = settlementService;
        this.mockWalletService = mockWalletService;
    }
    async getBalance(userId) {
        let wallet = await this.walletRepository.findByUserId(userId);
        if (!wallet) {
            wallet = await this.walletRepository.createWallet(new wallet_entity_1.WalletEntity({ userId, balance: 20.0 }));
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
    async executeHandoffSettlement(searcherId, leaverId, matchId) {
        return this.settlementService.executeHandoffSettlement(searcherId, leaverId, matchId);
    }
    async topUp(userId, dto) {
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
    async cashOut(userId, dto) {
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
    async getTransactions(userId, page = 1, limit = 20) {
        let wallet = await this.walletRepository.findByUserId(userId);
        if (!wallet) {
            wallet = await this.walletRepository.createWallet(new wallet_entity_1.WalletEntity({ userId, balance: 20.0 }));
        }
        const { transactions, total } = await this.walletRepository.getTransactionHistory(wallet.id, page, limit);
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
};
exports.WalletService = WalletService;
exports.WalletService = WalletService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(wallet_repository_port_1.WALLET_REPOSITORY_PORT)),
    __metadata("design:paramtypes", [Object, settlement_transaction_service_1.SettlementTransactionService,
        mock_wallet_service_1.MockWalletService])
], WalletService);
//# sourceMappingURL=wallet.service.js.map