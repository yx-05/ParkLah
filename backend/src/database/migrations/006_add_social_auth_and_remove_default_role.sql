-- Migration 006: Social Authentication Fields & Unified Dual-Role Driver Model

-- 1. Make phone_number nullable initially (to support Google / Facebook OAuth logins before phone linking)
ALTER TABLE users ALTER COLUMN phone_number DROP NOT NULL;

-- 2. Drop the restrictive default_role column since all users can act as both SEARCHER and LEAVER
ALTER TABLE users DROP COLUMN IF EXISTS default_role;

-- 3. Add email and social provider identity columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) NOT NULL DEFAULT 'PHONE' CHECK (auth_provider IN ('PHONE', 'GOOGLE', 'FACEBOOK', 'APPLE'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);

-- 4. Create performance indexes for social logins
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_provider ON users(auth_provider, auth_provider_id);
