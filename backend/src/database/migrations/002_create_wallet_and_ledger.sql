-- User Wallets Table (with Optimistic Lock Version)
CREATE TABLE IF NOT EXISTS user_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
    balance NUMERIC(12, 2) NOT NULL DEFAULT 20.00 CHECK (balance >= 0.00),
    locked_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (locked_balance >= 0.00),
    currency VARCHAR(3) NOT NULL DEFAULT 'MYR',
    version INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON user_wallets(user_id);

-- Double-Entry Wallet Ledger Transactions
CREATE TABLE IF NOT EXISTS wallet_ledger_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES user_wallets(id) ON DELETE RESTRICT,
    match_id UUID,
    idempotency_key VARCHAR(150) NOT NULL UNIQUE,
    transaction_type VARCHAR(30) NOT NULL 
        CHECK (transaction_type IN ('MOCK_TOPUP', 'MOCK_CASHOUT', 'GATEWAY_TOPUP', 'PAYOUT_CASHOUT', 'SEARCHER_HANDOFF_FEE', 'LEAVER_HANDOFF_REWARD', 'PLATFORM_COMMISSION', 'DISPUTE_REFUND')),
    amount NUMERIC(12, 2) NOT NULL, -- Positive for credit, negative for debit
    balance_after NUMERIC(12, 2) NOT NULL CHECK (balance_after >= 0.00),
    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'REVERSED')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_wallet_id ON wallet_ledger_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_match_id ON wallet_ledger_transactions(match_id);
