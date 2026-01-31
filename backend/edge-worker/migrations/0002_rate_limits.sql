-- Migration: Add internal endpoint rate limiting table
-- Date: 2025-08-07

-- This migration creates the endpoint_rate_limits table for internal endpoint tracking.
-- Note: This does NOT touch the api_rate_limits table (created in migration 0004).
-- 
-- Historical context: An earlier version of this migration created a table named 
-- "api_rate_limits" with a different schema (endpoint column). That was renamed to
-- "endpoint_rate_limits" to avoid conflicts with the external API rate limits table
-- in migration 0004 (which uses a provider column).
--
-- For databases that already ran the old version with the conflicting name,
-- manual cleanup may be needed before migration 0004 runs.

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
