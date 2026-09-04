-- Matches Table
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    searcher_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    leaver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    probabilistic_spot_id UUID REFERENCES probabilistic_spots(id) ON DELETE SET NULL,
    match_type VARCHAR(20) NOT NULL CHECK (match_type IN ('REAL_TIME_P2P', 'PROBABILISTIC_DB')),
    spot_geom GEOMETRY(Point, 4326) NOT NULL,
    spot_latitude NUMERIC(10, 7) NOT NULL,
    spot_longitude NUMERIC(10, 7) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OFFERED' 
        CHECK (status IN ('OFFERED', 'ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'COMPLETED', 'FAILED_SPOT_TAKEN', 'CANCELLED_SEARCHER', 'CANCELLED_LEAVER', 'TIMEOUT')),
    searcher_charge_amount NUMERIC(6, 2) NOT NULL DEFAULT 0.50,
    leaver_reward_amount NUMERIC(6, 2) NOT NULL DEFAULT 0.25,
    platform_fee_amount NUMERIC(6, 2) NOT NULL DEFAULT 0.25,
    handshake_timeout_seconds INTEGER NOT NULL DEFAULT 15,
    offered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    arrived_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason VARCHAR(50)
);
CREATE INDEX IF NOT EXISTS idx_matches_searcher_id ON matches(searcher_id);
CREATE INDEX IF NOT EXISTS idx_matches_leaver_id ON matches(leaver_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
