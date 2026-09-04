# Task Breakdown: Module 8 - In-App Wallet & Micro-Transactions Subsystem (`wallet-and-ledger`)

**Module Identifier:** `wallet-and-ledger`  
**Parent Subsystem:** Backend Application Layer (`WalletAndLedgerModule`)  
**Input Documents:**  
- PRD: `backend/planning/01_prd.md` (Section 1.3, FR-7.1, FR-7.2, Section 6.3)  
- High-Level Design: `backend/planning/02_high-level-design.md` (Section 3, Module 8; Section 5.4, Flow 4; Section 6.1; Section 8.4)  
- Detailed Design: `backend/planning/03_detailed-design.md` (Section 3.1–3.2, Section 4, Section 5.8, Section 7)  

---

## 1. Module Overview & Scope
The **In-App Wallet & Micro-Transactions Subsystem** manages the double-entry immutable financial ledger for all RM micro-transactions. It guarantees ACID transactional integrity during peer handoff settlements (Searcher debit: $-\text{RM }0.50$, Leaver credit: $+\text{RM }0.25$, Platform margin: $+\text{RM }0.25$). For Phase 1 MVP, it provides simulated preloaded test balances ($\text{RM }20.00$) with top-up and cash-out operations, while defining abstract payment gateway ports for Phase 2 production integrations (FPX, Touch 'n Go eWallet, DuitNow).

---

## 2. Granular Task Checklist

### Phase 1: Database Migration & Ledger Schema
- [x] **Task 8.1: PostgreSQL Migration for `user_wallets` and `wallet_ledger_transactions`**
  - **File:** `backend/src/database/migrations/005_create_wallet_and_ledger_tables.sql`
  - **Details:**
    - Create `user_wallets` table: `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`, `user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT`, `balance NUMERIC(12,2) NOT NULL DEFAULT 20.00 CHECK (balance >= 0.00)`, `locked_balance NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (locked_balance >= 0.00)`, `currency VARCHAR(3) NOT NULL DEFAULT 'MYR'`, `version INT NOT NULL DEFAULT 1`, `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`.
    - Create `wallet_ledger_transactions` table: `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`, `wallet_id UUID NOT NULL REFERENCES user_wallets(id) ON DELETE RESTRICT`, `match_id UUID REFERENCES matches(id) ON DELETE SET NULL`, `idempotency_key VARCHAR(50) NOT NULL UNIQUE`, `transaction_type VARCHAR(30) NOT NULL CHECK (transaction_type IN ('MOCK_TOPUP', 'MOCK_CASHOUT', 'GATEWAY_TOPUP', 'PAYOUT_CASHOUT', 'SEARCHER_HANDOFF_FEE', 'LEAVER_HANDOFF_REWARD', 'PLATFORM_COMMISSION', 'DISPUTE_REFUND'))`, `amount NUMERIC(12,2) NOT NULL`, `balance_after NUMERIC(12,2) NOT NULL CHECK (balance_after >= 0.00)`, `status VARCHAR(20) DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'REVERSED'))`, `metadata JSONB DEFAULT '{}'`, `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`.
    - Create indices on `user_wallets(user_id)`, `wallet_ledger_transactions(wallet_id)`, `wallet_ledger_transactions(match_id)`.
  - **Acceptance Criteria:** Strict check constraints prevent negative wallet balances; idempotency keys enforce uniqueness.

### Phase 2: Domain Entities & Repository Ports
- [x] **Task 8.2: Domain Entities & Exceptions**
  - **File:** `backend/src/modules/wallet/domain/entities/wallet.entity.ts`, `backend/src/modules/wallet/domain/entities/ledger-transaction.entity.ts`, `backend/src/modules/wallet/domain/exceptions/insufficient-balance.exception.ts`
  - **Details:** Define domain entities with currency formatting (`RM XX.XX`) and `InsufficientWalletBalanceException` (HTTP 402, `WALLET_INSUFFICIENT_BALANCE`).
  - **Acceptance Criteria:** Business logic prevents creating debit entries when balance is inadequate.

- [x] **Task 8.3: Wallet Repository Port & PostgreSQL Adapter**
  - **File:** `backend/src/modules/wallet/domain/ports/wallet-repository.port.ts`, `backend/src/modules/wallet/infrastructure/adapters/postgres-wallet.repository.ts`
  - **Details:** Implement `IWalletRepositoryPort`:
    - `findByUserId(userId)`: Fetches wallet.
    - `findByUserIdWithLock(userId, queryRunner)`: Executes `SELECT ... FOR UPDATE` for row-level locking.
    - `updateBalance(walletId, newBalance, queryRunner)`: Updates wallet balance and increments version.
    - `recordLedgerEntry(entry, queryRunner)`: Inserts immutable transaction ledger row.
    - `getTransactionHistory(walletId, page, limit)`: Paginated ledger history query.
  - **Acceptance Criteria:** Supports transactional execution within external database transactions (`QueryRunner` / client).

### Phase 3: Atomic Transaction Settlement Engine
- [x] **Task 8.4: ACID Financial Settlement Engine**
  - **File:** `backend/src/modules/wallet/domain/services/settlement-transaction.service.ts`
  - **Details:** Implement serializable database transaction:
    1. Lock and fetch Searcher wallet with `FOR UPDATE`.
    2. Check `searcherWallet.balance >= 0.50` (throw `InsufficientWalletBalanceException` if false).
    3. Lock and fetch Leaver wallet with `FOR UPDATE`.
    4. Compute `newSearcherBalance = balance - 0.50`, `newLeaverBalance = balance + 0.25`.
    5. Update both wallet records.
    6. Insert double-entry ledger rows with idempotency keys:
       - `match:${matchId}:searcher:debit` ($-\text{RM }0.50$)
       - `match:${matchId}:leaver:credit` ($+\text{RM }0.25$)
    7. Commit transaction; automatically rollback on any failure.
  - **Acceptance Criteria:** Guaranteed zero double-spends; duplicate settlement attempts trigger unique key violations.

### Phase 4: Mock Operations & Payment Gateway Abstractions
- [x] **Task 8.5: Mock Top-Up & Cash-Out Operations (Phase 1 MVP)**
  - **File:** `backend/src/modules/wallet/application/services/mock-wallet.service.ts`
  - **Details:**
    - `mockTopUp(userId, amount)`: Adds RM 10, RM 20, or RM 50 to user balance with `MOCK_TOPUP` ledger entry.
    - `mockCashOut(userId, amount)`: Withdraws amount from user balance with `MOCK_CASHOUT` ledger entry.
  - **Acceptance Criteria:** Immediate atomic ledger updates and real-time balance emission.

- [x] **Task 8.6: Payment Gateway Port & Stub Adapter (Phase 2 Architecture)**
  - **File:** `backend/src/modules/wallet/domain/ports/payment-gateway.port.ts`, `backend/src/modules/wallet/infrastructure/adapters/stub-payment-gateway.adapter.ts`
  - **Details:** Define `IPaymentGatewayPort` (`initiateTopUp(userId, amount, method)`, `processWithdrawal(userId, amount, bankDetails)`) for FPX, Touch 'n Go eWallet, and DuitNow integrations.
  - **Acceptance Criteria:** Cleanly decoupled for Phase 2 vendor onboarding.

### Phase 5: Application Service & REST Controllers
- [x] **Task 8.7: Wallet Application Service (`WalletService`)**
  - **File:** `backend/src/modules/wallet/application/services/wallet.service.ts`
  - **Details:** Facade providing `getBalance(userId)`, `executeHandoffSettlement(searcherId, leaverId, matchId)`, `topUp(userId, dto)`, `cashOut(userId, dto)`, `getTransactions(userId, query)`.
  - **Acceptance Criteria:** Emits `wallet:balance_update` socket events upon any balance modification.

- [x] **Task 8.8: Wallet REST Controller (`WalletController`)**
  - **File:** `backend/src/modules/wallet/infrastructure/controllers/wallet.controller.ts`
  - **Details:**
    - `GET /api/v1/wallet/balance`
    - `GET /api/v1/wallet/transactions`
    - `POST /api/v1/wallet/mock/topup`
    - `POST /api/v1/wallet/mock/cashout`
  - **Acceptance Criteria:** Protected by `JwtAuthGuard`; returns formatted currency and balance data.

### Phase 6: Automated Unit & Concurrency Testing
- [x] **Task 8.9: Wallet Settlement Unit Tests**
  - **File:** `backend/test/unit/wallet/wallet.service.spec.ts`
  - **Details:** Test RM 0.50 debit, RM 0.25 credit, insufficient balance exception, and ledger entry creation.
  - **Acceptance Criteria:** 100% test pass rate.

- [x] **Task 8.10: Financial Transaction Concurrency & ACID Integration Tests**
  - **File:** `backend/test/integration/wallet/wallet-acid.spec.ts`
  - **Details:** Test concurrent settlement calls, duplicate idempotency key collisions, and transaction rollback integrity on simulated failure.
  - **Acceptance Criteria:** 100% test pass rate with zero balance discrepancies.
