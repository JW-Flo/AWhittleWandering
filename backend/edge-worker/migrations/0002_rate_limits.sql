-- Migration: Add internal endpoint rate limiting table
-- Date: 2025-08-07

-- Handle legacy api_rate_limits table if it exists (from old version of this migration)
-- This allows migration 0004 to create api_rate_limits with the new schema
DROP TABLE IF EXISTS api_rate_limits;

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
