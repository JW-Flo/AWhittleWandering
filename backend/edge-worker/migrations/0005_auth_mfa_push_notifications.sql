-- Auth + MFA + Push + Notifications (Additive)
-- Adds password auth fields, TOTP MFA storage, browser push subscriptions,
-- per-journey follow notification prefs, and an in-app notifications inbox.

PRAGMA foreign_keys = ON;

-- =====================================================
-- USERS: add password auth fields (additive)
-- =====================================================
-- NOTE: D1/SQLite supports ADD COLUMN (no IF NOT EXISTS), so keep this migration idempotent
-- by tolerating "duplicate column" errors during repeated local runs.

-- D1 doesn't support "ADD COLUMN IF NOT EXISTS" and will error if rerun.
-- This migration should only be applied once per database.
ALTER TABLE users ADD COLUMN password_hash TEXT;
ALTER TABLE users ADD COLUMN password_salt TEXT;
ALTER TABLE users ADD COLUMN password_algo TEXT DEFAULT 'pbkdf2_sha256_v1';
ALTER TABLE users ADD COLUMN password_updated_at DATETIME;
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'; -- 'user'|'super_user'|'admin'|'owner' (visitor is unauthenticated)

-- =====================================================
-- MFA (TOTP + Recovery codes)
-- =====================================================

CREATE TABLE IF NOT EXISTS mfa_factors (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  factor_type TEXT NOT NULL, -- 'totp'
  friendly_name TEXT,
  -- Encrypted secret (base64url JSON blob) - never plaintext
  secret_enc TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  verified_at DATETIME,
  revoked_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_mfa_factors_user ON mfa_factors(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_factors_user_verified ON mfa_factors(user_id, verified_at, revoked_at);

CREATE TABLE IF NOT EXISTS mfa_recovery_codes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  used_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_mfa_recovery_user ON mfa_recovery_codes(user_id, used_at);

-- =====================================================
-- Browser push subscriptions (Web Push)
-- =====================================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  ua_hash TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_seen_at DATETIME,
  revoked_at DATETIME,
  UNIQUE(user_id, endpoint),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id, revoked_at);

-- =====================================================
-- Per-journey follows + notification preferences
-- =====================================================

CREATE TABLE IF NOT EXISTS journey_follows (
  id TEXT PRIMARY KEY,
  journey_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  unfollowed_at DATETIME,
  UNIQUE(journey_id, user_id),
  FOREIGN KEY (journey_id) REFERENCES journey_registry(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_journey_follows_journey ON journey_follows(journey_id, unfollowed_at);
CREATE INDEX IF NOT EXISTS idx_journey_follows_user ON journey_follows(user_id, unfollowed_at);

CREATE TABLE IF NOT EXISTS journey_follow_notification_prefs (
  journey_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  notify_waypoints INTEGER DEFAULT 1,
  notify_state_crossings INTEGER DEFAULT 1,
  notify_photos INTEGER DEFAULT 1,
  notify_charging INTEGER DEFAULT 0,
  notify_security INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (journey_id, user_id),
  FOREIGN KEY (journey_id) REFERENCES journey_registry(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- =====================================================
-- In-app notifications inbox
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  journey_id TEXT,
  notification_type TEXT NOT NULL, -- 'journey_waypoint', 'journey_photo', 'security_new_device', etc.
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  metadata_json TEXT, -- JSON string (untrusted; validate at read boundary)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  read_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read_at, created_at DESC);


