-- Enable PostGIS & UUID extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    default_role VARCHAR(10) NOT NULL DEFAULT 'SEARCHER' CHECK (default_role IN ('SEARCHER', 'LEAVER')),
    reliability_rating NUMERIC(3, 2) NOT NULL DEFAULT 5.00 CHECK (reliability_rating >= 0.00 AND reliability_rating <= 5.00),
    total_completed_matches INTEGER NOT NULL DEFAULT 0 CHECK (total_completed_matches >= 0),
    total_disputes_count INTEGER NOT NULL DEFAULT 0 CHECK (total_disputes_count >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);

-- 2. User Vehicles Table
CREATE TABLE IF NOT EXISTS user_vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    make_model VARCHAR(50) NOT NULL,
    color VARCHAR(30) NOT NULL,
    plate_suffix VARCHAR(4) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_vehicles_user_id ON user_vehicles(user_id);
