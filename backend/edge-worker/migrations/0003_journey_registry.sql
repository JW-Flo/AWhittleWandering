-- Journey Registry - Multi-tenant platform management
-- This table tracks all journeys and their provisioned resources

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  auth_provider TEXT DEFAULT 'email', -- 'email', 'google', 'apple'
  auth_provider_id TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login_at DATETIME
);

-- Journey registry - tracks all user journeys and their resources
CREATE TABLE IF NOT EXISTS journey_registry (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Vehicle configuration
  vehicle_vin TEXT,
  tessie_api_key TEXT, -- Encrypted in production
  
  -- Provisioned Cloudflare resources
  d1_database_id TEXT,
  d1_database_name TEXT,
  r2_bucket_name TEXT,
  
  -- Journey metadata
  start_date DATE,
  end_date DATE,
  target_states INTEGER DEFAULT 48,
  
  -- Status tracking
  status TEXT DEFAULT 'pending', -- 'pending', 'provisioning', 'active', 'suspended', 'deleted'
  provisioning_error TEXT,
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- API keys for journey access (for sharing, integrations)
CREATE TABLE IF NOT EXISTS journey_api_keys (
  id TEXT PRIMARY KEY,
  journey_id TEXT NOT NULL,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL, -- Hashed API key
  key_prefix TEXT NOT NULL, -- First 8 chars for identification
  permissions TEXT DEFAULT '["read"]', -- JSON array of permissions
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at DATETIME,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (journey_id) REFERENCES journey_registry(id)
);

-- Audit log for platform operations
CREATE TABLE IF NOT EXISTS platform_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  journey_id TEXT,
  action TEXT NOT NULL, -- 'create_journey', 'provision', 'delete', 'update_config', etc.
  details TEXT, -- JSON with action details
  ip_address TEXT,
  user_agent TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (journey_id) REFERENCES journey_registry(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_journey_registry_user ON journey_registry(user_id);
CREATE INDEX IF NOT EXISTS idx_journey_registry_status ON journey_registry(status);
CREATE INDEX IF NOT EXISTS idx_journey_api_keys_journey ON journey_api_keys(journey_id);
CREATE INDEX IF NOT EXISTS idx_platform_audit_log_user ON platform_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_audit_log_journey ON platform_audit_log(journey_id);
CREATE INDEX IF NOT EXISTS idx_platform_audit_log_timestamp ON platform_audit_log(timestamp DESC);

