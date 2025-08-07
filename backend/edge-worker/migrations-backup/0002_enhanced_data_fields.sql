-- Enhanced Tesla Data Fields Migration
-- Adds all critical fields identified in comprehensive Tessie API analysis
-- This migration enhances the existing optimized schema with 23+ additional fields

PRAGMA foreign_keys = ON;

-- =====================================================
-- ENHANCED DRIVES TABLE (Add 12 critical fields)
-- =====================================================

-- Add Tessie-specific identifiers
ALTER TABLE drives ADD COLUMN tessie_drive_id INTEGER;
ALTER TABLE drives ADD COLUMN tessie_created_at DATETIME;

-- Add precise coordinate tracking
ALTER TABLE drives ADD COLUMN starting_latitude_precise REAL;
ALTER TABLE drives ADD COLUMN starting_longitude_precise REAL;
ALTER TABLE drives ADD COLUMN ending_latitude_precise REAL;
ALTER TABLE drives ADD COLUMN ending_longitude_precise REAL;

-- Add precise odometer tracking
ALTER TABLE drives ADD COLUMN starting_odometer REAL;
ALTER TABLE drives ADD COLUMN ending_odometer REAL;

-- Add temperature and comfort tracking
ALTER TABLE drives ADD COLUMN average_inside_temp REAL;
ALTER TABLE drives ADD COLUMN average_outside_temp REAL;

-- Add Tesla-calculated efficiency metrics
ALTER TABLE drives ADD COLUMN rated_range_used REAL DEFAULT 0;
ALTER TABLE drives ADD COLUMN autopilot_distance REAL DEFAULT 0;

-- =====================================================
-- ENHANCED CHARGES TABLE (Add 8 critical fields)
-- =====================================================

-- Add Tessie-specific identifiers
ALTER TABLE charges ADD COLUMN tessie_charge_id INTEGER;
ALTER TABLE charges ADD COLUMN tessie_created_at DATETIME;

-- Add charger classification
ALTER TABLE charges ADD COLUMN is_supercharger BOOLEAN DEFAULT FALSE;
ALTER TABLE charges ADD COLUMN is_fast_charger BOOLEAN DEFAULT FALSE;

-- Add Tesla calculations
ALTER TABLE charges ADD COLUMN miles_added REAL DEFAULT 0;
ALTER TABLE charges ADD COLUMN miles_added_ideal REAL DEFAULT 0;
ALTER TABLE charges ADD COLUMN energy_used_charging REAL DEFAULT 0;
ALTER TABLE charges ADD COLUMN since_last_charge REAL DEFAULT 0;

-- =====================================================
-- ENHANCED VEHICLE STATE TABLE (Add 10 critical fields)
-- =====================================================

-- Add software and hardware tracking
ALTER TABLE vehicle_state ADD COLUMN car_version TEXT;
ALTER TABLE vehicle_state ADD COLUMN api_version INTEGER;

-- Add battery health monitoring
ALTER TABLE vehicle_state ADD COLUMN pack_current REAL;
ALTER TABLE vehicle_state ADD COLUMN pack_voltage REAL;
ALTER TABLE vehicle_state ADD COLUMN energy_remaining REAL;
ALTER TABLE vehicle_state ADD COLUMN lifetime_energy_used REAL;

-- Add safety and security monitoring
ALTER TABLE vehicle_state ADD COLUMN sentry_mode BOOLEAN DEFAULT FALSE;

-- Add tire pressure monitoring (TPMS)
ALTER TABLE vehicle_state ADD COLUMN tpms_pressure_fl REAL;
ALTER TABLE vehicle_state ADD COLUMN tpms_pressure_fr REAL;
ALTER TABLE vehicle_state ADD COLUMN tpms_pressure_rl REAL;
ALTER TABLE vehicle_state ADD COLUMN tpms_pressure_rr REAL;

-- =====================================================
-- NEW: OVERNIGHT STAYS TABLE (Automation tracking)
-- =====================================================

CREATE TABLE IF NOT EXISTS overnight_stays (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  journey_id TEXT NOT NULL,
  location_name TEXT,
  address TEXT,
  latitude REAL DEFAULT 0,
  longitude REAL DEFAULT 0,
  state_name TEXT,
  city TEXT,
  arrival_time DATETIME NOT NULL,
  departure_time DATETIME,
  duration_hours REAL,
  stay_type TEXT DEFAULT 'Unknown', -- 'Hotel', 'Home', 'Campground', 'Friend', 'Other'
  charged_overnight BOOLEAN DEFAULT FALSE,
  energy_added_overnight REAL DEFAULT 0,
  cost_overnight REAL DEFAULT 0,
  notes TEXT,
  auto_detected BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (journey_id) REFERENCES journeys(id)
);

-- =====================================================
-- NEW: AUTOMATION EVENTS TABLE (Smart triggers)
-- =====================================================

CREATE TABLE IF NOT EXISTS automation_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  journey_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'state_entry', 'charging_start', 'overnight_stay', 'milestone', 'weather_alert'
  trigger_data TEXT, -- JSON data about what triggered the event
  action_taken TEXT, -- What automation was executed
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  metadata TEXT, -- Additional JSON data
  FOREIGN KEY (journey_id) REFERENCES journeys(id)
);

-- =====================================================
-- NEW: WEATHER TRACKING TABLE (Environmental data)
-- =====================================================

CREATE TABLE IF NOT EXISTS weather_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  journey_id TEXT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  timestamp DATETIME NOT NULL,
  temperature REAL,
  humidity REAL,
  wind_speed REAL,
  wind_direction REAL,
  conditions TEXT, -- 'Clear', 'Rain', 'Snow', etc.
  visibility REAL,
  precipitation REAL,
  source TEXT DEFAULT 'API', -- 'API', 'Vehicle', 'Manual'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (journey_id) REFERENCES journeys(id)
);

-- =====================================================
-- NEW: VEHICLE CONFIGURATION TABLE (Static data)
-- =====================================================

CREATE TABLE IF NOT EXISTS vehicle_configuration (
  vehicle_id TEXT PRIMARY KEY,
  display_name TEXT,
  model TEXT,
  trim TEXT,
  year INTEGER,
  color_name TEXT,
  wheel_type TEXT,
  interior_type TEXT,
  autopilot_version TEXT,
  fsd_capability BOOLEAN DEFAULT FALSE,
  performance_package BOOLEAN DEFAULT FALSE,
  tow_package BOOLEAN DEFAULT FALSE,
  premium_connectivity BOOLEAN DEFAULT FALSE,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

-- =====================================================
-- ENHANCED INDEXES (Performance optimization)
-- =====================================================

-- Tessie ID indexes for deduplication
CREATE UNIQUE INDEX IF NOT EXISTS idx_drives_tessie_id ON drives(tessie_drive_id) WHERE tessie_drive_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_charges_tessie_id ON charges(tessie_charge_id) WHERE tessie_charge_id IS NOT NULL;

-- Precise location indexes
CREATE INDEX IF NOT EXISTS idx_drives_precise_start ON drives(starting_latitude_precise, starting_longitude_precise);
CREATE INDEX IF NOT EXISTS idx_drives_precise_end ON drives(ending_latitude_precise, ending_longitude_precise);

-- Odometer tracking indexes
CREATE INDEX IF NOT EXISTS idx_drives_odometer_range ON drives(starting_odometer, ending_odometer);

-- Charging classification indexes
CREATE INDEX IF NOT EXISTS idx_charges_classification ON charges(is_supercharger, is_fast_charger);

-- Battery health indexes
CREATE INDEX IF NOT EXISTS idx_vehicle_battery_health ON vehicle_state(pack_current, pack_voltage, energy_remaining);

-- Automation indexes
CREATE INDEX IF NOT EXISTS idx_overnight_stays_location ON overnight_stays(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_overnight_stays_duration ON overnight_stays(arrival_time, departure_time);
CREATE INDEX IF NOT EXISTS idx_automation_events_type ON automation_events(event_type, timestamp);

-- Weather indexes
CREATE INDEX IF NOT EXISTS idx_weather_location_time ON weather_data(latitude, longitude, timestamp);

-- =====================================================
-- ENHANCED VIEWS (Intelligence-enhanced)
-- =====================================================

-- Overnight Stays Detection View
CREATE VIEW IF NOT EXISTS detected_overnight_stays AS
SELECT 
  journey_id,
  MIN(timestamp) as arrival_time,
  MAX(timestamp) as departure_time,
  ROUND((julianday(MAX(timestamp)) - julianday(MIN(timestamp))) * 24, 2) as duration_hours,
  state_name,
  city,
  latitude,
  longitude,
  COUNT(*) as data_points
FROM vehicle_state 
WHERE journey_id = 'continental-usa-2025'
GROUP BY 
  journey_id,
  DATE(timestamp),
  ROUND(latitude, 3), -- Group by approximate location
  ROUND(longitude, 3)
HAVING 
  duration_hours >= 6 -- At least 6 hours in same location
  AND data_points >= 12 -- At least 12 data points (1 hour of 5-min intervals)
ORDER BY arrival_time;

-- Charging Sessions with Intelligence
CREATE VIEW IF NOT EXISTS intelligent_charging_sessions AS
SELECT 
  c.*,
  -- Calculate efficiency metrics
  CASE 
    WHEN c.energy_added > 0 THEN ROUND(c.miles_added / c.energy_added, 2)
    ELSE 0 
  END as charging_efficiency,
  
  -- Classify charging type
  CASE 
    WHEN c.is_supercharger THEN 'Supercharger'
    WHEN c.is_fast_charger THEN 'Fast Charger'
    WHEN c.charger_power_kw >= 10 THEN 'Level 2'
    ELSE 'Level 1'
  END as charging_category,
  
  -- Calculate cost per mile if available
  CASE 
    WHEN c.cost_usd > 0 AND c.miles_added > 0 
    THEN ROUND(c.cost_usd / c.miles_added, 3)
    ELSE 0 
  END as cost_per_mile,
  
  -- Detect overnight charging
  CASE 
    WHEN c.duration_minutes >= 360 -- 6+ hours
    AND strftime('%H', datetime(c.started_at, 'unixepoch')) BETWEEN '20' AND '23' -- Started evening
    THEN TRUE
    ELSE FALSE
  END as likely_overnight_charge

FROM charges c
WHERE c.journey_id = 'continental-usa-2025'
ORDER BY c.started_at DESC;

-- State Entry Detection
CREATE VIEW IF NOT EXISTS state_entries AS
SELECT DISTINCT
  journey_id,
  state_name,
  MIN(timestamp) as first_entry,
  COUNT(*) as total_entries,
  -- Detect if this was the first time visiting this state
  ROW_NUMBER() OVER (PARTITION BY journey_id, state_name ORDER BY MIN(timestamp)) as visit_sequence
FROM vehicle_state
WHERE journey_id = 'continental-usa-2025' 
  AND state_name IS NOT NULL
GROUP BY journey_id, state_name, DATE(timestamp)
ORDER BY first_entry;

-- =====================================================
-- ENHANCED TRIGGERS (Intelligent automation)
-- =====================================================

-- Trigger: Auto-detect overnight stays
CREATE TRIGGER IF NOT EXISTS auto_detect_overnight_stays
AFTER INSERT ON vehicle_state
BEGIN
  -- Check if we've been stationary for 6+ hours
  INSERT OR IGNORE INTO overnight_stays (
    journey_id, location_name, address, latitude, longitude, 
    state_name, city, arrival_time, stay_type, auto_detected
  )
  SELECT 
    'continental-usa-2025',
    NEW.city || ', ' || NEW.state_name,
    NULL,
    NEW.latitude,
    NEW.longitude,
    NEW.state_name,
    NEW.city,
    datetime(NEW.timestamp, 'unixepoch'),
    'Auto-detected',
    TRUE
  WHERE 
    -- Only if we don't already have a stay at this location today
    NOT EXISTS (
      SELECT 1 FROM overnight_stays 
      WHERE journey_id = 'continental-usa-2025'
      AND DATE(arrival_time) = DATE(datetime(NEW.timestamp, 'unixepoch'))
      AND ABS(latitude - NEW.latitude) < 0.01
      AND ABS(longitude - NEW.longitude) < 0.01
    )
    -- And we have at least 6 hours of data at this location
    AND EXISTS (
      SELECT 1 FROM vehicle_state 
      WHERE journey_id = 'continental-usa-2025'
      AND ABS(latitude - NEW.latitude) < 0.01
      AND ABS(longitude - NEW.longitude) < 0.01
      AND timestamp BETWEEN NEW.timestamp - 21600 AND NEW.timestamp -- 6 hours ago
      GROUP BY DATE(timestamp)
      HAVING COUNT(*) >= 72 -- 6 hours of 5-minute intervals
    );
END;

-- Trigger: Auto-detect state entries
CREATE TRIGGER IF NOT EXISTS auto_detect_state_entries
AFTER INSERT ON vehicle_state
BEGIN
  -- Record automation event for new state entry
  INSERT INTO automation_events (
    journey_id, event_type, trigger_data, action_taken, metadata
  )
  SELECT 
    'continental-usa-2025',
    'state_entry',
    json_object('state', NEW.state_name, 'city', NEW.city),
    'State entry logged',
    json_object('latitude', NEW.latitude, 'longitude', NEW.longitude, 'timestamp', NEW.timestamp)
  WHERE 
    NEW.state_name IS NOT NULL
    -- Only if this is a new state for today
    AND NOT EXISTS (
      SELECT 1 FROM vehicle_state 
      WHERE journey_id = 'continental-usa-2025'
      AND state_name = NEW.state_name
      AND DATE(timestamp) = DATE(datetime(NEW.timestamp, 'unixepoch'))
      AND timestamp < NEW.timestamp
    );
END;

-- Trigger: Enhanced cache clearing
CREATE TRIGGER IF NOT EXISTS enhanced_cache_clearing
AFTER INSERT ON drives
BEGIN
  DELETE FROM component_cache 
  WHERE journey_id = NEW.journey_id 
  AND component_name IN ('overview', 'timeline', 'map', 'stats', 'automations');
END;
