-- Journey Data Import Tables
-- For importing historical Tesla data from CSV files and narrative waypoints

PRAGMA foreign_keys = ON;

-- =====================================================
-- DRIVE SEGMENTS (CSV Import)
-- =====================================================

CREATE TABLE IF NOT EXISTS drive_segments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  journey_id TEXT NOT NULL,
  vehicle_id TEXT NOT NULL,

  -- Deduplication key (hash of start_time + start_lat + start_lng + end_lat + end_lng)
  dedup_key TEXT UNIQUE NOT NULL,

  -- Temporal data
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  duration_minutes INTEGER DEFAULT 0,

  -- Location data
  start_address TEXT,
  end_address TEXT,
  start_latitude REAL NOT NULL,
  start_longitude REAL NOT NULL,
  end_latitude REAL NOT NULL,
  end_longitude REAL NOT NULL,
  start_state TEXT,
  end_state TEXT,

  -- Distance and efficiency
  distance_miles REAL DEFAULT 0,
  energy_used_kwh REAL DEFAULT 0,
  efficiency_miles_per_kwh REAL DEFAULT 0,

  -- Battery data
  start_battery_level INTEGER DEFAULT 0,
  end_battery_level INTEGER DEFAULT 0,
  battery_delta INTEGER DEFAULT 0,

  -- Environmental conditions
  avg_outside_temp_f REAL,
  avg_inside_temp_f REAL,

  -- Speed data
  avg_speed_mph REAL DEFAULT 0,
  max_speed_mph REAL DEFAULT 0,

  -- Additional Tesla data
  rated_range_used REAL DEFAULT 0,
  odometer_start REAL,
  odometer_end REAL,

  -- Metadata
  import_source TEXT DEFAULT 'csv',
  import_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (journey_id) REFERENCES journeys(id),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

CREATE INDEX IF NOT EXISTS idx_segments_journey ON drive_segments(journey_id);
CREATE INDEX IF NOT EXISTS idx_segments_dedup ON drive_segments(dedup_key);
CREATE INDEX IF NOT EXISTS idx_segments_time ON drive_segments(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_segments_location ON drive_segments(start_latitude, start_longitude, end_latitude, end_longitude);

-- =====================================================
-- ENERGY EVENTS (Charging CSV Import)
-- =====================================================

CREATE TABLE IF NOT EXISTS energy_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  journey_id TEXT NOT NULL,
  vehicle_id TEXT NOT NULL,

  -- Deduplication key (hash of start_time + latitude + longitude + energy_added)
  dedup_key TEXT UNIQUE NOT NULL,

  -- Event type
  event_type TEXT NOT NULL DEFAULT 'charge', -- 'charge', 'discharge', 'regeneration'

  -- Temporal data
  start_time DATETIME NOT NULL,
  end_time DATETIME,
  duration_minutes INTEGER DEFAULT 0,

  -- Location data
  location_name TEXT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  state_name TEXT,
  city TEXT,
  address TEXT,

  -- Charger information
  charger_type TEXT, -- 'Supercharger', 'Destination', 'Level2', 'Level1', 'Home'
  is_supercharger BOOLEAN DEFAULT FALSE,
  charger_power_kw REAL DEFAULT 0,
  charging_network TEXT,

  -- Energy data
  energy_added_kwh REAL DEFAULT 0,
  energy_used_kwh REAL DEFAULT 0, -- Losses during charging
  charge_efficiency_percent REAL DEFAULT 0,

  -- Charge rate
  avg_charge_rate_kw REAL DEFAULT 0,
  peak_charge_rate_kw REAL DEFAULT 0,

  -- Battery data
  start_battery_level INTEGER DEFAULT 0,
  end_battery_level INTEGER DEFAULT 0,
  battery_delta INTEGER DEFAULT 0,

  -- Range data
  start_range_miles REAL DEFAULT 0,
  end_range_miles REAL DEFAULT 0,
  miles_added INTEGER DEFAULT 0,
  miles_added_rated INTEGER DEFAULT 0,

  -- Cost data
  cost_usd REAL DEFAULT 0,
  cost_per_kwh REAL DEFAULT 0,

  -- Odometer
  odometer REAL,

  -- Metadata
  import_source TEXT DEFAULT 'csv',
  import_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (journey_id) REFERENCES journeys(id),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

CREATE INDEX IF NOT EXISTS idx_energy_events_journey ON energy_events(journey_id);
CREATE INDEX IF NOT EXISTS idx_energy_events_dedup ON energy_events(dedup_key);
CREATE INDEX IF NOT EXISTS idx_energy_events_time ON energy_events(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_energy_events_location ON energy_events(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_energy_events_type ON energy_events(event_type);

-- =====================================================
-- WAYPOINTS (Narrative Journey Data)
-- =====================================================

CREATE TABLE IF NOT EXISTS waypoints (
  id TEXT PRIMARY KEY,
  journey_id TEXT NOT NULL,

  -- Order and sequencing
  sequence_number INTEGER NOT NULL,

  -- Temporal data
  timestamp DATETIME NOT NULL,
  date TEXT NOT NULL, -- YYYY-MM-DD for easy filtering

  -- Location data
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  location_name TEXT NOT NULL,
  state_name TEXT,
  city TEXT,
  address TEXT,

  -- Waypoint type
  waypoint_type TEXT NOT NULL DEFAULT 'narrative', -- 'narrative', 'photo', 'milestone', 'poi'
  category TEXT, -- 'scenic', 'food', 'lodging', 'landmark', 'rest', 'charge'

  -- Rich content
  title TEXT NOT NULL,
  description TEXT,
  narrative_text TEXT, -- Long-form narrative/journal entry

  -- Media references
  photo_urls TEXT, -- JSON array of photo URLs
  media_ids TEXT, -- JSON array of media table IDs

  -- Tags and metadata
  tags TEXT, -- JSON array of tags
  weather TEXT, -- JSON object with weather data
  highlights TEXT, -- JSON array of key highlights

  -- Social/sharing
  is_public BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,

  -- Related data
  segment_id INTEGER, -- Link to drive_segments
  energy_event_id INTEGER, -- Link to energy_events

  -- Metadata
  author TEXT,
  import_source TEXT DEFAULT 'manual',
  import_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (journey_id) REFERENCES journeys(id),
  FOREIGN KEY (segment_id) REFERENCES drive_segments(id),
  FOREIGN KEY (energy_event_id) REFERENCES energy_events(id)
);

CREATE INDEX IF NOT EXISTS idx_waypoints_journey ON waypoints(journey_id);
CREATE INDEX IF NOT EXISTS idx_waypoints_sequence ON waypoints(journey_id, sequence_number);
CREATE INDEX IF NOT EXISTS idx_waypoints_time ON waypoints(timestamp);
CREATE INDEX IF NOT EXISTS idx_waypoints_date ON waypoints(date);
CREATE INDEX IF NOT EXISTS idx_waypoints_location ON waypoints(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_waypoints_type ON waypoints(waypoint_type);
CREATE INDEX IF NOT EXISTS idx_waypoints_public ON waypoints(is_public, is_featured);

-- =====================================================
-- IMPORT AUDIT LOG
-- =====================================================

CREATE TABLE IF NOT EXISTS import_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  journey_id TEXT NOT NULL,

  -- Import metadata
  import_type TEXT NOT NULL, -- 'drive_segments', 'energy_events', 'waypoints'
  import_source TEXT NOT NULL, -- 'csv', 'json', 'api', 'manual'
  filename TEXT,

  -- Stats
  records_processed INTEGER DEFAULT 0,
  records_imported INTEGER DEFAULT 0,
  records_skipped INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,

  -- Status
  status TEXT DEFAULT 'processing', -- 'processing', 'completed', 'failed', 'partial'
  error_summary TEXT, -- JSON array of error messages

  -- Performance
  duration_ms INTEGER DEFAULT 0,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,

  -- User/admin tracking
  imported_by TEXT,
  ip_address TEXT,

  FOREIGN KEY (journey_id) REFERENCES journeys(id)
);

CREATE INDEX IF NOT EXISTS idx_import_audit_journey ON import_audit(journey_id);
CREATE INDEX IF NOT EXISTS idx_import_audit_type ON import_audit(import_type);
CREATE INDEX IF NOT EXISTS idx_import_audit_time ON import_audit(started_at);
CREATE INDEX IF NOT EXISTS idx_import_audit_status ON import_audit(status);
