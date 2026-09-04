-- Dispute Reports Table
CREATE TABLE IF NOT EXISTS dispute_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE RESTRICT,
    reporter_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    spot_id UUID REFERENCES probabilistic_spots(id) ON DELETE SET NULL,
    dispute_type VARCHAR(40) NOT NULL CHECK (dispute_type IN ('SPOT_TAKEN_BY_STRANGER', 'LEAVER_DID_NOT_LEAVE', 'WRONG_LOCATION', 'SEARCHER_NO_SHOW')),
    description VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'AUTO_RESOLVED', 'MANUAL_REVIEW', 'REJECTED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_dispute_reports_match_id ON dispute_reports(match_id);
