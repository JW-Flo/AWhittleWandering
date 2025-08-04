-- Component-Ready Data Tables Migration
-- These are ADDITIVE only - no existing table changes
-- Safe to deploy without breaking current functionality

-- Journey Overview Component Data
CREATE TABLE IF NOT EXISTS journey_overview (
  id TEXT PRIMARY KEY,
  journey_id TEXT NOT NULL,
  total_miles INTEGER NOT NULL,
  current_odometer INTEGER NOT NULL,
  trip_miles INTEGER NOT NULL,
  days_elapsed INTEGER NOT NULL,
  states_visited_count INTEGER NOT NULL,
  journey_start_date TEXT NOT NULL,
  journey_end_date TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  last_updated TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Current Status Component Data  
CREATE TABLE IF NOT EXISTS current_status (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT NOT NULL,
  battery_level INTEGER NOT NULL,
  battery_range INTEGER NOT NULL,
  charging_status TEXT NOT NULL,
  current_speed INTEGER NOT NULL,
  current_city TEXT,
  current_state TEXT,
  current_latitude REAL,
  current_longitude REAL,
  inside_temp_f INTEGER,
  outside_temp_f INTEGER,
  is_locked BOOLEAN,
  is_climate_on BOOLEAN,
  last_updated TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- States Progress Component Data
CREATE TABLE IF NOT EXISTS states_progress (
  id TEXT PRIMARY KEY,
  journey_id TEXT NOT NULL,
  state_name TEXT NOT NULL,
  state_abbreviation TEXT NOT NULL,
  first_visited_date TEXT NOT NULL,
  visit_order INTEGER,
  total_miles_in_state REAL,
  cities_visited TEXT,
  is_current_state BOOLEAN DEFAULT FALSE,
  last_updated TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Recent Drives Component Data
CREATE TABLE IF NOT EXISTS recent_drives_summary (
  id TEXT PRIMARY KEY,
  journey_id TEXT NOT NULL,
  drive_date TEXT NOT NULL,
  start_city TEXT NOT NULL,
  start_state TEXT NOT NULL,
  end_city TEXT NOT NULL,
  end_state TEXT NOT NULL,
  distance_miles REAL NOT NULL,
  duration_hours REAL NOT NULL,
  energy_used_kwh REAL,
  average_speed_mph INTEGER,
  drive_order INTEGER,
  last_updated TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_journey_overview_journey_id ON journey_overview (journey_id);
CREATE INDEX IF NOT EXISTS idx_current_status_vehicle_id ON current_status (vehicle_id);
CREATE INDEX IF NOT EXISTS idx_states_progress_journey_id ON states_progress (journey_id);
CREATE INDEX IF NOT EXISTS idx_recent_drives_journey_id ON recent_drives_summary (journey_id);
CREATE INDEX IF NOT EXISTS idx_recent_drives_order ON recent_drives_summary (journey_id, drive_order);
