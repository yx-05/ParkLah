"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletEntity = void 0;
const exceptions_1 = require("../../../../common/exceptions");
class WalletEntity {
    constructor(props) {
        this.id = props.id || this.generateUuid();
        this.userId = props.userId;
        this.balance = props.balance !== undefined ? props.balance : 20.0;
        this.lockedBalance = props.lockedBalance !== undefined ? props.lockedBalance : 0.0;
        this.currency = props.currency || 'MYR';
        this.version = props.version || 1;
        this.updatedAt = props.updatedAt || new Date();
    }
    debit(amount) {
        if (amount <= 0) {
            throw new Error('Debit amount must be positive');
        }
        const roundedAmount = Math.round(amount * 100) / 100;
        if (this.balance < roundedAmount) {
            throw new exceptions_1.InsufficientWalletBalanceException(`Insufficient balance. Current: RM ${this.balance.toFixed(2)}, Required: RM ${roundedAmount.toFixed(2)}`);
        }
        this.balance = Math.round((this.balance - roundedAmount) * 100) / 100;
        this.version += 1;
        this.updatedAt = new Date();
        return this.balance;
    }
    credit(amount) {
        if (amount <= 0) {
            throw new Error('Credit amount must be positive');
        }
        const roundedAmount = Math.round(amount * 100) / 100;
        this.balance = Math.round((this.balance + roundedAmount) * 100) / 100;
        this.version += 1;
        this.updatedAt = new Date();
        return this.balance;
    }
    getFormattedBalance() {
        return `RM ${this.balance.toFixed(2)}`;
    }
    generateUuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }
}
exports.WalletEntity = WalletEntity;
//# sourceMappingURL=wallet.entity.js.map