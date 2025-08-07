-- 🎵 Spotify Tesla Integration Tables
-- Song request widget and notification system

-- Song Requests Table
CREATE TABLE IF NOT EXISTS song_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  song_name TEXT NOT NULL,
  artist TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  message TEXT,
  spotify_uri TEXT,
  played_at DATETIME,
  status TEXT DEFAULT 'queued', -- 'queued', 'played', 'skipped', 'failed'
  location TEXT, -- Tesla location when requested
  ip_address TEXT, -- Requestor IP for spam prevention
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Notifications Table  
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL, -- 'song_request', 'automation_trigger', 'system_alert'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata TEXT, -- JSON data
  read_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Automation Rules Table
CREATE TABLE IF NOT EXISTS automation_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL, -- 'location', 'time', 'battery', 'charging', 'driving'
  trigger_condition TEXT NOT NULL, -- JSON condition
  action_type TEXT NOT NULL, -- 'notification', 'spotify', 'climate', 'api_call'
  action_config TEXT NOT NULL, -- JSON action config
  enabled BOOLEAN DEFAULT TRUE,
  last_triggered DATETIME,
  trigger_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Widget Analytics Table
CREATE TABLE IF NOT EXISTS widget_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  widget_type TEXT NOT NULL, -- 'song_request', 'location_share', 'message'
  user_identifier TEXT, -- IP or user ID
  action TEXT NOT NULL, -- 'view', 'submit', 'play'
  metadata TEXT, -- JSON data
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_song_requests_status ON song_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(read_at, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_automation_rules_enabled ON automation_rules(enabled, trigger_type);
CREATE INDEX IF NOT EXISTS idx_widget_analytics_type ON widget_analytics(widget_type, timestamp DESC);

-- Initial automation rules
INSERT OR IGNORE INTO automation_rules (name, trigger_type, trigger_condition, action_type, action_config) VALUES
('Welcome Home', 'location', '{"area": "home", "radius_meters": 100}', 'notification', '{"title": "🏠 Joe is home!", "message": "Perfect time to send a song request!"}'),
('Road Trip Mode', 'driving', '{"speed_above": 60, "duration_minutes": 30}', 'spotify', '{"playlist": "road_trip_vibes", "auto_play": true}'),
('Low Battery Alert', 'battery', '{"level_below": 20}', 'notification', '{"title": "🔋 Low Battery Alert", "urgent": true}'),
('Charging Complete', 'charging', '{"state": "complete"}', 'notification', '{"title": "⚡ Charging Complete", "action": "ready_to_go"}'),
('Long Stop Detection', 'location', '{"stationary_minutes": 60}', 'notification', '{"title": "📍 Long Stop", "message": "Joe has been stopped for an hour"}')
