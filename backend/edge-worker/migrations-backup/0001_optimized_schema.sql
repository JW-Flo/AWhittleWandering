-- Tesla Journey Tracker - Optimized Single D1 Database Schema
-- Component-optimized design with clear data access patterns

PRAGMA foreign_keys = ON;

-- =====================================================
-- CORE DATA TABLES (Raw operational data)
-- =====================================================

-- Vehicles - Tesla vehicle information
CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  vin TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  color TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Journeys - Trip metadata
CREATE TABLE IF NOT EXISTS journeys (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT NOT NULL,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'paused'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

-- Vehicle State - Current real-time state (single row per vehicle)
CREATE TABLE IF NOT EXISTS vehicle_state (
  vehicle_id TEXT PRIMARY KEY,
  battery_level INTEGER DEFAULT 0,
  battery_range REAL DEFAULT 0,
  charging_state TEXT DEFAULT 'Unknown',
  latitude REAL DEFAULT 0,
  longitude REAL DEFAULT 0,
  speed REAL DEFAULT 0,
  odometer REAL DEFAULT 0,
  inside_temp REAL,
  outside_temp REAL,
  power INTEGER, -- kW usage
  locked BOOLEAN DEFAULT FALSE,
  climate_on BOOLEAN DEFAULT FALSE,
  shift_state TEXT,
  timestamp DATETIME NOT NULL,
  state_name TEXT,
  city TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

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
  outside_temp_avg REAL,
  efficiency_miles_per_kwh REAL DEFAULT 0,
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
  charger_type TEXT, -- 'Supercharger', 'Destination', 'Home'
  charger_power_kw REAL DEFAULT 0,
  energy_added_kwh REAL DEFAULT 0,
  start_battery_level INTEGER DEFAULT 0,
  end_battery_level INTEGER DEFAULT 0,
  cost_usd REAL DEFAULT 0,
  duration_minutes INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  FOREIGN KEY (journey_id) REFERENCES journeys(id)
);

-- States Visited - Journey progress tracking
CREATE TABLE IF NOT EXISTS states_visited (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  journey_id TEXT NOT NULL,
  state_name TEXT NOT NULL,
  state_code TEXT,
  first_visited_date DATE,
  visit_count INTEGER DEFAULT 1,
  total_miles_in_state REAL DEFAULT 0,
  is_current_state BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (journey_id) REFERENCES journeys(id),
  UNIQUE(journey_id, state_name)
);

-- =====================================================
-- COMPONENT CACHE TABLES (Optimized for UI components)
-- =====================================================

-- API Response Cache - For expensive component queries
CREATE TABLE IF NOT EXISTS component_cache (
  cache_key TEXT PRIMARY KEY,
  component_name TEXT NOT NULL, -- 'overview', 'timeline', 'map', 'stats'
  cache_data TEXT NOT NULL, -- JSON response optimized for component
  expires_at DATETIME NOT NULL,
  journey_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (journey_id) REFERENCES journeys(id)
);

-- =====================================================
-- ANALYTICS TABLES (Computed periodically)
-- =====================================================

-- Daily Journey Stats - Aggregated daily metrics
CREATE TABLE IF NOT EXISTS daily_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  journey_id TEXT NOT NULL,
  date TEXT NOT NULL, -- YYYY-MM-DD
  miles_driven REAL DEFAULT 0,
  drives_count INTEGER DEFAULT 0,
  charges_count INTEGER DEFAULT 0,
  energy_used_kwh REAL DEFAULT 0,
  energy_added_kwh REAL DEFAULT 0,
  cost_usd REAL DEFAULT 0,
  avg_efficiency REAL DEFAULT 0,
  states_visited_today INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (journey_id) REFERENCES journeys(id),
  UNIQUE(journey_id, date)
);

-- =====================================================
-- AUXILIARY TABLES
-- =====================================================

-- Media Files
CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  journey_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  title TEXT,
  latitude REAL,
  longitude REAL,
  taken_at DATETIME,
  drive_id INTEGER,
  charge_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (journey_id) REFERENCES journeys(id),
  FOREIGN KEY (drive_id) REFERENCES drives(id),
  FOREIGN KEY (charge_id) REFERENCES charges(id)
);

-- System Logs
CREATE TABLE IF NOT EXISTS ingestion_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  operation TEXT NOT NULL, -- 'vehicle_state', 'drives', 'charges'
  records_processed INTEGER DEFAULT 0,
  success BOOLEAN DEFAULT TRUE,
  errors TEXT,
  duration_ms INTEGER DEFAULT 0,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- OPTIMIZED INDEXES (Component-focused)
-- =====================================================

-- Core data indexes
CREATE INDEX IF NOT EXISTS idx_drives_journey_date ON drives(journey_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_drives_location ON drives(start_latitude, start_longitude);
CREATE INDEX IF NOT EXISTS idx_charges_journey_date ON charges(journey_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_states_visited_journey ON states_visited(journey_id, is_current_state);

-- Component cache indexes
CREATE INDEX IF NOT EXISTS idx_component_cache_expires ON component_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_component_cache_component ON component_cache(component_name, journey_id);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_daily_stats_journey_date ON daily_stats(journey_id, date DESC);

-- =====================================================
-- COMPONENT-OPTIMIZED VIEWS
-- =====================================================

-- Overview Component View
CREATE VIEW IF NOT EXISTS overview_data AS
SELECT 
  j.id as journey_id,
  j.name,
  j.start_date,
  j.status,
  
  -- Current vehicle state
  vs.battery_level,
  vs.battery_range,
  vs.charging_state,
  vs.odometer,
  vs.state_name as current_state,
  vs.city as current_city,
  vs.timestamp as last_update,
  
  -- Journey aggregates (real-time calculated)
  (SELECT COUNT(*) FROM states_visited WHERE journey_id = j.id) as states_visited,
  (SELECT COUNT(*) FROM drives WHERE journey_id = j.id) as total_drives,
  (SELECT COUNT(*) FROM charges WHERE journey_id = j.id) as total_charges,
  (SELECT COALESCE(SUM(distance_miles), 0) FROM drives WHERE journey_id = j.id) as total_miles,
  (SELECT COALESCE(SUM(cost_usd), 0) FROM charges WHERE journey_id = j.id) as total_cost,
  
  -- Trip duration
  (julianday('now') - julianday(j.start_date)) as days_elapsed

FROM journeys j
LEFT JOIN vehicle_state vs ON vs.vehicle_id = j.vehicle_id;

-- Timeline Component View
CREATE VIEW IF NOT EXISTS timeline_data AS
SELECT 
  'drive' as event_type,
  d.id,
  d.started_at as timestamp,
  d.start_address as location,
  d.end_address as destination,
  d.distance_miles as primary_metric,
  'miles' as metric_unit,
  d.start_latitude as latitude,
  d.start_longitude as longitude,
  d.start_state as state_name,
  json_object(
    'duration', d.duration_minutes,
    'energyUsed', d.energy_used_kwh,
    'avgSpeed', d.average_speed,
    'efficiency', d.efficiency_miles_per_kwh
  ) as details
FROM drives d
WHERE d.journey_id = 'continental-usa-2025'

UNION ALL

SELECT 
  'charge' as event_type,
  c.id,
  c.started_at as timestamp,
  c.location,
  c.charger_type as destination,
  c.energy_added_kwh as primary_metric,
  'kWh' as metric_unit,
  c.latitude,
  c.longitude,
  c.state_name,
  json_object(
    'duration', c.duration_minutes,
    'cost', c.cost_usd,
    'chargerPower', c.charger_power_kw,
    'batteryStart', c.start_battery_level,
    'batteryEnd', c.end_battery_level
  ) as details
FROM charges c
WHERE c.journey_id = 'continental-usa-2025'

ORDER BY timestamp DESC;

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert initial records
INSERT OR IGNORE INTO vehicles (id, vin, display_name, model, year, color) 
VALUES ('midnight-shadow', 'UNKNOWN_VIN', 'Midnight Shadow', 'Model Y', 2023, 'Midnight Silver Metallic');

INSERT OR IGNORE INTO journeys (id, vehicle_id, name, start_date, status) 
VALUES ('continental-usa-2025', 'midnight-shadow', 'A Whittle Wandering - Continental USA', '2025-06-01', 'active');

-- =====================================================
-- TRIGGERS FOR DATA CONSISTENCY
-- =====================================================

-- Auto-calculate drive efficiency
CREATE TRIGGER IF NOT EXISTS update_drive_efficiency 
AFTER INSERT ON drives
BEGIN
  UPDATE drives 
  SET efficiency_miles_per_kwh = 
    CASE 
      WHEN NEW.energy_used_kwh > 0 
      THEN ROUND(NEW.distance_miles / NEW.energy_used_kwh, 2)
      ELSE 0 
    END
  WHERE id = NEW.id;
END;

-- Clear component cache when core data changes
CREATE TRIGGER IF NOT EXISTS clear_cache_on_drive_insert 
AFTER INSERT ON drives
BEGIN
  DELETE FROM component_cache 
  WHERE journey_id = NEW.journey_id 
  AND (component_name = 'overview' OR component_name = 'timeline');
END;

CREATE TRIGGER IF NOT EXISTS clear_cache_on_charge_insert 
AFTER INSERT ON charges
BEGIN
  DELETE FROM component_cache 
  WHERE journey_id = NEW.journey_id 
  AND (component_name = 'overview' OR component_name = 'timeline');
END;
