-- Probabilistic Spots Table
CREATE TABLE IF NOT EXISTS probabilistic_spots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    leaver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    location_geom GEOMETRY(Point, 4326) NOT NULL,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    initial_p NUMERIC(4, 3) NOT NULL DEFAULT 0.950,
    current_p NUMERIC(4, 3) NOT NULL DEFAULT 0.950,
    area_traffic_multiplier NUMERIC(3, 2) NOT NULL DEFAULT 1.00,
    landmark_note VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE' 
        CHECK (status IN ('AVAILABLE', 'RESERVED', 'OCCUPIED', 'EXPIRED')),
    vacated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- GiST Spatial Index for ultra-fast spatial search (ST_DWithin)
CREATE INDEX IF NOT EXISTS idx_probabilistic_spots_geom ON probabilistic_spots USING GIST(location_geom);
CREATE INDEX IF NOT EXISTS idx_probabilistic_spots_status_p ON probabilistic_spots(status, current_p DESC);
CREATE INDEX IF NOT EXISTS idx_probabilistic_spots_expires ON probabilistic_spots(expires_at) WHERE status = 'AVAILABLE';
