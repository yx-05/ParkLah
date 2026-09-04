"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LedgerTransactionEntity = void 0;
class LedgerTransactionEntity {
    constructor(props) {
        this.id = props.id || this.generateUuid();
        this.walletId = props.walletId;
        this.matchId = props.matchId || null;
        this.idempotencyKey = props.idempotencyKey;
        this.transactionType = props.transactionType;
        this.amount = props.amount;
        this.balanceAfter = props.balanceAfter;
        this.status = props.status || 'COMPLETED';
        this.metadata = props.metadata || {};
        this.createdAt = props.createdAt || new Date();
    }
    generateUuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }
}
exports.LedgerTransactionEntity = LedgerTransactionEntity;
//# sourceMappingURL=ledger-transaction.entity.js.map