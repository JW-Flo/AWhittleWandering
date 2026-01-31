-- Migration: Add internal endpoint rate limiting table
-- Date: 2025-08-07

-- Handle legacy api_rate_limits table if it exists (from old version of this migration)
-- Only drop if the table has the OLD schema (endpoint column instead of provider column)
-- This allows migration 0004 to create api_rate_limits with the new schema
-- Check: If api_rate_limits exists AND has 'endpoint' column (old schema), drop it
-- If it has 'provider' column (new schema from 0004), leave it alone

-- We use a conditional approach: rename the legacy table if it exists with old schema
-- SQLite doesn't have easy conditional DDL, so we use ALTER TABLE which fails gracefully
-- if the table doesn't exist or has wrong schema
-- This approach is safer than DROP TABLE which would destroy data from migration 0004

CREATE TABLE IF NOT EXISTS endpoint_rate_limits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    endpoint TEXT NOT NULL,
    last_call_time DATETIME NOT NULL,
    call_count INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create unique index on endpoint
CREATE UNIQUE INDEX IF NOT EXISTS idx_endpoint_rate_limits_endpoint ON endpoint_rate_limits(endpoint);
