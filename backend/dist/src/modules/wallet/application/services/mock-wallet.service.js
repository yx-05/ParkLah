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
exports.MockWalletService = void 0;
const common_1 = require("@nestjs/common");
const wallet_repository_port_1 = require("../../domain/ports/wallet-repository.port");
const wallet_entity_1 = require("../../domain/entities/wallet.entity");
const ledger_transaction_entity_1 = require("../../domain/entities/ledger-transaction.entity");
let MockWalletService = class MockWalletService {
    constructor(walletRepository) {
        this.walletRepository = walletRepository;
    }
    async mockTopUp(userId, amount) {
        let wallet = await this.walletRepository.findByUserId(userId);
        if (!wallet) {
            wallet = await this.walletRepository.createWallet(new wallet_entity_1.WalletEntity({ userId, balance: 20.0 }));
        }
        wallet.credit(amount);
        await this.walletRepository.updateWallet(wallet);
        const idempotencyKey = `mock:topup:${userId}:${Date.now()}:${Math.random().toString(36).substring(2, 7)}`;
        const tx = await this.walletRepository.recordLedgerEntry(new ledger_transaction_entity_1.LedgerTransactionEntity({
            walletId: wallet.id,
            idempotencyKey,
            transactionType: 'MOCK_TOPUP',
            amount,
            balanceAfter: wallet.balance,
            status: 'COMPLETED',
            metadata: { topUpMethod: 'MOCK' },
        }));
        return { wallet, transaction: tx };
    }
    async mockCashOut(userId, amount) {
        let wallet = await this.walletRepository.findByUserId(userId);
        if (!wallet) {
            wallet = await this.walletRepository.createWallet(new wallet_entity_1.WalletEntity({ userId, balance: 20.0 }));
        }
        wallet.debit(amount);
        await this.walletRepository.updateWallet(wallet);
        const idempotencyKey = `mock:cashout:${userId}:${Date.now()}:${Math.random().toString(36).substring(2, 7)}`;
        const tx = await this.walletRepository.recordLedgerEntry(new ledger_transaction_entity_1.LedgerTransactionEntity({
            walletId: wallet.id,
            idempotencyKey,
            transactionType: 'MOCK_CASHOUT',
            amount: -amount,
            balanceAfter: wallet.balance,
            status: 'COMPLETED',
            metadata: { cashOutMethod: 'MOCK' },
        }));
        return { wallet, transaction: tx };
    }
};
exports.MockWalletService = MockWalletService;
exports.MockWalletService = MockWalletService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(wallet_repository_port_1.WALLET_REPOSITORY_PORT)),
    __metadata("design:paramtypes", [Object])
], MockWalletService);
//# sourceMappingURL=mock-wallet.service.js.map