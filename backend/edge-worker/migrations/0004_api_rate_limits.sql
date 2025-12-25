-- API Rate Limit Tracking
-- Tracks usage across all external API providers to:
-- 1. Skip providers at capacity (reduce latency)
-- 2. Know when limits reset
-- 3. Enable smart provider selection
-- 4. Provide usage analytics

CREATE TABLE IF NOT EXISTS api_rate_limits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,            -- e.g., 'serper', 'brave', 'tavily', 'nominatim'
  request_date TEXT NOT NULL,        -- YYYY-MM-DD
  request_hour INTEGER NOT NULL,     -- 0-23 UTC
  request_minute INTEGER NOT NULL,   -- 0-59
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  total_latency_ms INTEGER DEFAULT 0,
  last_error_code TEXT,              -- Last error code if any (e.g., '429', 'TIMEOUT')
  updated_at TEXT NOT NULL
);

-- Create unique index separately to avoid column reference issues
CREATE UNIQUE INDEX IF NOT EXISTS idx_api_rate_limits_unique
ON api_rate_limits(provider, request_date, request_hour, request_minute);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_rate_limits_provider_date ON api_rate_limits(provider, request_date);
CREATE INDEX IF NOT EXISTS idx_rate_limits_date ON api_rate_limits(request_date);
CREATE INDEX IF NOT EXISTS idx_rate_limits_provider ON api_rate_limits(provider);

-- Provider configurations table (temporarily removed to fix deployment)
-- CREATE TABLE IF NOT EXISTS api_provider_configs (
--   provider TEXT PRIMARY KEY,
--   monthly_limit INTEGER NOT NULL,
--   daily_limit INTEGER,
--   minute_limit INTEGER,
--   reset_day INTEGER DEFAULT 1,       -- Day of month limits reset (1-31)
--   reset_hour INTEGER DEFAULT 0,      -- Hour limits reset (0-23 UTC)
--   is_enabled INTEGER DEFAULT 1,
--   priority INTEGER DEFAULT 100,      -- Lower = higher priority
--   created_at TEXT DEFAULT CURRENT_TIMESTAMP,
--   updated_at TEXT DEFAULT CURRENT_TIMESTAMP
-- );

-- Insert default provider configs (will be added via separate migration after deployment)
-- INSERT OR IGNORE INTO api_provider_configs (provider, monthly_limit, daily_limit, minute_limit, priority) VALUES
--   ('serper', 2500, NULL, NULL, 10),
--   ('brave', 2000, 100, NULL, 20),
--   ('tavily', 1000, NULL, NULL, 30),
--   ('nominatim', 30000, 1000, 1, 5),  -- OSM has strict per-minute limits
--   ('cloudflare_ai', 10000, NULL, NULL, 100);