-- Tesla Journey Tracker - Comprehensive D1 Database Schema
-- Optimized for real-time data ingestion, component queries, and scalability

PRAGMA foreign_keys = ON;

-- =====================================================
-- CORE ENTITIES
-- =====================================================

-- Vehicles table - Tesla vehicle information
CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  vin TEXT UNIQUE NOT NULL,
  display_name TEXT,
  vehicle_type TEXT,
  model TEXT,
  year INTEGER,
  color TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Journeys table - Trip metadata and aggregated stats
CREATE TABLE IF NOT EXISTS journeys (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  total_states INTEGER DEFAULT 0,
  target_states INTEGER DEFAULT 48,
  total_miles REAL DEFAULT 0,
  total_drives INTEGER DEFAULT 0,
  total_charges INTEGER DEFAULT 0,
  total_energy_used_kwh REAL DEFAULT 0,
  total_cost_usd REAL DEFAULT 0,
  overall_efficiency_miles_per_kwh REAL DEFAULT 0,
  status TEXT DEFAULT 'active', -- 'planning', 'active', 'completed', 'paused'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

-- =====================================================
-- REAL-TIME DATA TABLES
-- =====================================================

-- Vehicle states - Current real-time vehicle state (single row per vehicle)
CREATE TABLE IF NOT EXISTS vehicle_state (
  vehicle_id TEXT PRIMARY KEY,
  vin TEXT NOT NULL,
  battery_level INTEGER DEFAULT 0,
  battery_range REAL DEFAULT 0,
  charging_state TEXT DEFAULT 'Unknown',
  latitude REAL DEFAULT 0,
  longitude REAL DEFAULT 0,
  heading REAL DEFAULT 0,
  speed REAL DEFAULT 0,
  odometer REAL DEFAULT 0,
  inside_temp REAL,
  outside_temp REAL,
  shift_state TEXT,
  power INTEGER, -- kW usage
  locked BOOLEAN DEFAULT FALSE,
  climate_on BOOLEAN DEFAULT FALSE,
  software_update_status TEXT,
  car_version TEXT,
  timestamp DATETIME NOT NULL,
  state_name TEXT,
  city TEXT,
  address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

-- Vehicle state history - Historical tracking for analytics
CREATE TABLE IF NOT EXISTS vehicle_state_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id TEXT NOT NULL,
  vin TEXT NOT NULL,
  battery_level INTEGER DEFAULT 0,
  battery_range REAL DEFAULT 0,
  charging_state TEXT DEFAULT 'Unknown',
  latitude REAL DEFAULT 0,
  longitude REAL DEFAULT 0,
  heading REAL DEFAULT 0,
  speed REAL DEFAULT 0,
  odometer REAL DEFAULT 0,
  inside_temp REAL,
  outside_temp REAL,
  power INTEGER,
  timestamp DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

-- =====================================================
-- TRIP DATA TABLES
-- =====================================================

-- Drives - Individual driving segments
CREATE TABLE IF NOT EXISTS drives (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tessie_id INTEGER UNIQUE,
  vehicle_id TEXT NOT NULL,
  journey_id TEXT NOT NULL,
  started_at DATETIME NOT NULL,
  ended_at DATETIME NOT NULL,
  start_address TEXT,
  end_address TEXT,
  start_latitude REAL DEFAULT 0,
  start_longitude REAL DEFAULT 0,
  end_latitude REAL DEFAULT 0,
  end_longitude REAL DEFAULT 0,
  start_state TEXT,
  end_state TEXT,
  distance_miles REAL DEFAULT 0,
  duration_minutes INTEGER DEFAULT 0,
  energy_used_kwh REAL DEFAULT 0,
  average_speed REAL DEFAULT 0,
  max_speed REAL DEFAULT 0,
  start_battery_level INTEGER DEFAULT 0,
  end_battery_level INTEGER DEFAULT 0,
  starting_range REAL DEFAULT 0,
  ending_range REAL DEFAULT 0,
  rated_range_used REAL DEFAULT 0,
  outside_temp_avg REAL,
  average_inside_temp REAL,
  drive_tag TEXT, -- Personal/Business
  efficiency_miles_per_kwh REAL DEFAULT 0,
  route_complexity TEXT, -- urban/highway/mixed
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  FOREIGN KEY (journey_id) REFERENCES journeys(id)
);

-- Charges - Charging sessions
CREATE TABLE IF NOT EXISTS charges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tessie_id INTEGER UNIQUE,
  vehicle_id TEXT NOT NULL,
  journey_id TEXT NOT NULL,
  started_at DATETIME NOT NULL,
  ended_at DATETIME,
  location TEXT,
  latitude REAL DEFAULT 0,
  longitude REAL DEFAULT 0,
  state_name TEXT,
  city TEXT,
  charger_type TEXT, -- 'Supercharger', 'Destination', 'Mobile', 'Home'
  charger_power_kw REAL DEFAULT 0,
  energy_added_kwh REAL DEFAULT 0,
  energy_used_kwh REAL DEFAULT 0, -- Different from energy_added
  charge_rate_avg REAL DEFAULT 0,
  charge_rate_max REAL DEFAULT 0,
  peak_charging_rate REAL DEFAULT 0,
  start_battery_level INTEGER DEFAULT 0,
  end_battery_level INTEGER DEFAULT 0,
  start_range REAL DEFAULT 0,
  end_range REAL DEFAULT 0,
  miles_added INTEGER DEFAULT 0,
  miles_added_ideal INTEGER DEFAULT 0,
  cost_usd REAL DEFAULT 0,
  cost_per_kwh REAL DEFAULT 0,
  duration_minutes INTEGER DEFAULT 0,
  is_supercharger BOOLEAN DEFAULT FALSE,
  charge_port_type TEXT, -- CCS, Tesla, etc.
  charging_efficiency_kw REAL DEFAULT 0,
  charging_network TEXT, -- Tesla/Electrify America/etc.
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  FOREIGN KEY (journey_id) REFERENCES journeys(id)
);

-- =====================================================
-- LOCATION & ANALYTICS TABLES
-- =====================================================

-- States visited tracking
CREATE TABLE IF NOT EXISTS states_visited (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  journey_id TEXT NOT NULL,
  state_name TEXT NOT NULL,
  state_code TEXT,
  first_visited_date DATE,
  first_drive_id INTEGER,
  visit_count INTEGER DEFAULT 1,
  total_miles_in_state REAL DEFAULT 0,
  total_time_minutes INTEGER DEFAULT 0,
  entry_latitude REAL,
  entry_longitude REAL,
  entry_address TEXT,
  is_current_state BOOLEAN DEFAULT FALSE,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (journey_id) REFERENCES journeys(id),
  FOREIGN KEY (first_drive_id) REFERENCES drives(id),
  UNIQUE(journey_id, state_name)
);

-- Daily analytics aggregates
CREATE TABLE IF NOT EXISTS daily_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  journey_id TEXT NOT NULL,
  date TEXT NOT NULL, -- YYYY-MM-DD format
  total_drives INTEGER DEFAULT 0,
  total_distance_miles REAL DEFAULT 0,
  total_energy_used_kwh REAL DEFAULT 0,
  total_charges INTEGER DEFAULT 0,
  total_energy_added_kwh REAL DEFAULT 0,
  total_cost_usd REAL DEFAULT 0,
  avg_speed_mph REAL DEFAULT 0,
  max_speed_mph REAL DEFAULT 0,
  efficiency_miles_per_kwh REAL DEFAULT 0,
  avg_charge_rate_kw REAL DEFAULT 0,
  supercharger_sessions INTEGER DEFAULT 0,
  destination_charges INTEGER DEFAULT 0,
  total_charge_time_minutes INTEGER DEFAULT 0,
  states_visited_count INTEGER DEFAULT 0,
  cities_visited_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (journey_id) REFERENCES journeys(id),
  UNIQUE(journey_id, date)
);

-- Efficiency metrics for trends
CREATE TABLE IF NOT EXISTS efficiency_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  journey_id TEXT NOT NULL,
  vehicle_id TEXT NOT NULL,
  date TEXT NOT NULL, -- YYYY-MM-DD
  miles_driven REAL DEFAULT 0,
  energy_consumed_kwh REAL DEFAULT 0,
  efficiency_miles_per_kwh REAL DEFAULT 0,
  avg_outside_temp_f REAL,
  avg_speed_mph REAL,
  elevation_gain_ft REAL,
  highway_miles_percent REAL,
  city_miles_percent REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (journey_id) REFERENCES journeys(id),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  UNIQUE(journey_id, vehicle_id, date)
);

-- =====================================================
-- COMPONENT DATA TABLES (for UI components)
-- =====================================================

-- Journey overview component data
CREATE TABLE IF NOT EXISTS journey_overview (
  id TEXT PRIMARY KEY,
  journey_id TEXT NOT NULL,
  total_miles REAL DEFAULT 0,
  current_odometer REAL DEFAULT 0,
  trip_miles REAL DEFAULT 0,
  days_elapsed INTEGER DEFAULT 0,
  states_visited_count INTEGER DEFAULT 0,
  journey_start_date DATE,
  status TEXT DEFAULT 'active',
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (journey_id) REFERENCES journeys(id),
  UNIQUE(journey_id)
);

-- Current status component data
CREATE TABLE IF NOT EXISTS current_status (
  id TEXT PRIMARY KEY,
  journey_id TEXT NOT NULL,
  current_state TEXT,
  current_city TEXT,
  current_latitude REAL DEFAULT 0,
  current_longitude REAL DEFAULT 0,
  battery_level INTEGER DEFAULT 0,
  battery_range REAL DEFAULT 0,
  charging_state TEXT DEFAULT 'Unknown',
  odometer REAL DEFAULT 0,
  location_description TEXT,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (journey_id) REFERENCES journeys(id),
  UNIQUE(journey_id)
);

-- =====================================================
-- MEDIA & CACHE TABLES
-- =====================================================

-- Media files metadata
CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  journey_id TEXT NOT NULL,
  vehicle_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  original_filename TEXT,
  mime_type TEXT,
  file_size INTEGER,
  r2_object_key TEXT UNIQUE NOT NULL,
  title TEXT,
  description TEXT,
  latitude REAL,
  longitude REAL,
  state_name TEXT,
  city TEXT,
  address TEXT,
  taken_at DATETIME,
  drive_id INTEGER,
  charge_id INTEGER,
  tags TEXT, -- JSON array of tags
  is_favorite BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  upload_ip TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (journey_id) REFERENCES journeys(id),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  FOREIGN KEY (drive_id) REFERENCES drives(id),
  FOREIGN KEY (charge_id) REFERENCES charges(id)
);

-- API cache for expensive operations
CREATE TABLE IF NOT EXISTS api_cache (
  cache_key TEXT PRIMARY KEY,
  cache_data TEXT NOT NULL, -- JSON data
  expires_at DATETIME NOT NULL,
  cache_type TEXT, -- 'tessie_vehicles', 'tessie_state', 'geocoding', etc.
  metadata TEXT, -- JSON metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SYSTEM TABLES
-- =====================================================

-- Analytics and performance tracking
CREATE TABLE IF NOT EXISTS analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL, -- 'api_call', 'page_view', 'media_upload', etc.
  event_data TEXT, -- JSON data
  user_ip TEXT,
  user_agent TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  processing_time_ms INTEGER,
  status_code INTEGER
);

-- Data ingestion logs
CREATE TABLE IF NOT EXISTS ingestion_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  operation TEXT NOT NULL, -- 'full_sync', 'vehicle_state', 'drives', 'charges'
  records_processed INTEGER DEFAULT 0,
  success BOOLEAN DEFAULT TRUE,
  errors TEXT, -- JSON array of error messages
  duration_ms INTEGER DEFAULT 0,
  api_calls_made INTEGER DEFAULT 0,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Background job queue
CREATE TABLE IF NOT EXISTS job_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_type TEXT NOT NULL, -- 'sync_tessie_data', 'process_media', 'update_states'
  job_data TEXT NOT NULL, -- JSON payload
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error_message TEXT,
  scheduled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  started_at DATETIME,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Core entity indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_vin ON vehicles(vin);
CREATE INDEX IF NOT EXISTS idx_journeys_vehicle ON journeys(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_journeys_status ON journeys(status);

-- Real-time data indexes
CREATE INDEX IF NOT EXISTS idx_vehicle_state_vin ON vehicle_state(vin);
CREATE INDEX IF NOT EXISTS idx_vehicle_state_history_vehicle_time ON vehicle_state_history(vehicle_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_state_history_location ON vehicle_state_history(latitude, longitude);

-- Trip data indexes
CREATE INDEX IF NOT EXISTS idx_drives_vehicle_journey ON drives(vehicle_id, journey_id);
CREATE INDEX IF NOT EXISTS idx_drives_dates ON drives(started_at, ended_at);
CREATE INDEX IF NOT EXISTS idx_drives_states ON drives(start_state, end_state);
CREATE INDEX IF NOT EXISTS idx_drives_efficiency ON drives(efficiency_miles_per_kwh);
CREATE INDEX IF NOT EXISTS idx_charges_vehicle_journey ON charges(vehicle_id, journey_id);
CREATE INDEX IF NOT EXISTS idx_charges_dates ON charges(started_at, ended_at);
CREATE INDEX IF NOT EXISTS idx_charges_cost ON charges(cost_per_kwh);

-- Location and analytics indexes
CREATE INDEX IF NOT EXISTS idx_states_visited_journey ON states_visited(journey_id);
CREATE INDEX IF NOT EXISTS idx_daily_analytics_journey_date ON daily_analytics(journey_id, date);
CREATE INDEX IF NOT EXISTS idx_efficiency_metrics_journey_date ON efficiency_metrics(journey_id, date);

-- Component data indexes
CREATE INDEX IF NOT EXISTS idx_journey_overview_journey ON journey_overview(journey_id);
CREATE INDEX IF NOT EXISTS idx_current_status_journey ON current_status(journey_id);

-- Media and cache indexes
CREATE INDEX IF NOT EXISTS idx_media_journey ON media(journey_id);
CREATE INDEX IF NOT EXISTS idx_media_location ON media(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_api_cache_expires ON api_cache(expires_at);

-- System indexes
CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_ingestion_logs_timestamp ON ingestion_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_job_queue_status ON job_queue(status, scheduled_at);

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert initial vehicle record
INSERT OR IGNORE INTO vehicles (
  id, vin, display_name, vehicle_type, model, year, color
) VALUES (
  'midnight-shadow', '5YJYGDEE5LF027324', 'Midnight Shadow', 'Tesla Model Y', 'Model Y', 2023, 'Midnight Silver Metallic'
);

-- Insert initial journey record
INSERT OR IGNORE INTO journeys (
  id, vehicle_id, name, description, start_date, target_states, status
) VALUES (
  'continental-usa-2025', 'midnight-shadow', 'A Whittle Wandering - Continental USA', 
  '48 Continental States Tesla Model Y Road Trip Adventure', '2025-06-01', 48, 'active'
);

-- Insert initial component data records
INSERT OR IGNORE INTO journey_overview (
  id, journey_id, journey_start_date, status
) VALUES (
  'continental-usa-2025-overview', 'continental-usa-2025', '2025-06-01', 'active'
);

INSERT OR IGNORE INTO current_status (
  id, journey_id
) VALUES (
  'continental-usa-2025-status', 'continental-usa-2025'
);