-- Migration 008: Create ML Match Features & Ground-Truth Outcomes Table
CREATE TABLE IF NOT EXISTS ml_match_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    searcher_id UUID NOT NULL REFERENCES users(id),
    leaver_id UUID REFERENCES users(id),
    spot_latitude NUMERIC(10, 7) NOT NULL,
    spot_longitude NUMERIC(10, 7) NOT NULL,

    -- Prediction Snapshot
    predicted_probability NUMERIC(5, 4) NOT NULL,
    dispatch_rank INTEGER NOT NULL,
    model_version VARCHAR(50) NOT NULL DEFAULT 'lightgbm_v1_synthetic',

    -- Complete JSON Feature Vector at Inference Time
    feature_payload JSONB NOT NULL,

    -- Ground Truth Outcome (Populated upon match completion / failure)
    ground_truth_outcome SMALLINT DEFAULT NULL CHECK (ground_truth_outcome IN (0, 1)),
    outcome_reason VARCHAR(50) DEFAULT NULL, -- 'PARKED_SUCCESS', 'HANDSHAKE_TIMEOUT', 'SPOT_TAKEN', 'SEARCHER_CANCEL', 'DECLINED'

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    settled_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ml_features_match_id ON ml_match_features(match_id);
CREATE INDEX IF NOT EXISTS idx_ml_features_searcher_id ON ml_match_features(searcher_id);
CREATE INDEX IF NOT EXISTS idx_ml_features_ground_truth ON ml_match_features(ground_truth_outcome) WHERE ground_truth_outcome IS NOT NULL;
