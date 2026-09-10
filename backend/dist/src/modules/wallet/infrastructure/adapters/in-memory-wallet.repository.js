"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryWalletRepository = void 0;
const common_1 = require("@nestjs/common");
let InMemoryWalletRepository = class InMemoryWalletRepository {
    constructor() {
        this.wallets = new Map();
        this.userToWalletId = new Map();
        this.ledger = new Map();
        this.transactions = [];
    }
    async findByUserId(userId) {
        const walletId = this.userToWalletId.get(userId);
        if (!walletId)
            return null;
        return this.wallets.get(walletId) || null;
    }
    async findById(walletId) {
        return this.wallets.get(walletId) || null;
    }
    async createWallet(wallet) {
        this.wallets.set(wallet.id, wallet);
        this.userToWalletId.set(wallet.userId, wallet.id);
        return wallet;
    }
    async updateWallet(wallet) {
        this.wallets.set(wallet.id, wallet);
        return wallet;
    }
    async recordLedgerEntry(transaction) {
        if (this.ledger.has(transaction.idempotencyKey)) {
            throw new Error(`Duplicate idempotency key: ${transaction.idempotencyKey}`);
        }
        this.ledger.set(transaction.idempotencyKey, transaction);
        this.transactions.push(transaction);
        return transaction;
    }
    async getLedgerEntryByIdempotencyKey(key) {
        return this.ledger.get(key) || null;
    }
    async getTransactionHistory(walletId, page = 1, limit = 20) {
        const filtered = this.transactions
            .filter((t) => t.walletId === walletId)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        const total = filtered.length;
        const start = (page - 1) * limit;
        const paginated = filtered.slice(start, start + limit);
        return {
            transactions: paginated,
            total,
        };
    }
    clear() {
        this.wallets.clear();
        this.userToWalletId.clear();
        this.ledger.clear();
        this.transactions = [];
    }
};
exports.InMemoryWalletRepository = InMemoryWalletRepository;
exports.InMemoryWalletRepository = InMemoryWalletRepository = __decorate([
    (0, common_1.Injectable)()
], InMemoryWalletRepository);
//# sourceMappingURL=in-memory-wallet.repository.js.map