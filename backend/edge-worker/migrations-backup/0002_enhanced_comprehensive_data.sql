-- Enhanced Tesla Data Schema - Phase 1 (High Priority Fields)
-- Adds 23 critical fields we were missing from comprehensive Tessie API analysis

PRAGMA foreign_keys = ON;

-- =====================================================
-- ENHANCED DRIVES TABLE (Add 8 critical fields)
-- =====================================================

-- Add missing high-priority drive fields
ALTER TABLE drives ADD COLUMN tessie_drive_id INTEGER UNIQUE;
ALTER TABLE drives ADD COLUMN created_at_tessie DATETIME; -- Import timestamp from Tessie
ALTER TABLE drives ADD COLUMN starting_latitude_precise REAL DEFAULT 0;
ALTER TABLE drives ADD COLUMN starting_longitude_precise REAL DEFAULT 0;
ALTER TABLE drives ADD COLUMN ending_latitude_precise REAL DEFAULT 0;
ALTER TABLE drives ADD COLUMN ending_longitude_precise REAL DEFAULT 0;
ALTER TABLE drives ADD COLUMN starting_odometer REAL DEFAULT 0;
ALTER TABLE drives ADD COLUMN ending_odometer REAL DEFAULT 0;

-- Add medium-priority analytics fields
ALTER TABLE drives ADD COLUMN average_inside_temp REAL;
ALTER TABLE drives ADD COLUMN average_outside_temp REAL;
ALTER TABLE drives ADD COLUMN rated_range_used REAL DEFAULT 0; -- Tesla's efficiency calc
ALTER TABLE drives ADD COLUMN autopilot_distance REAL DEFAULT 0;

-- =====================================================
-- ENHANCED CHARGES TABLE (Add 6 critical fields)
-- =====================================================

-- Add missing high-priority charge fields
ALTER TABLE charges ADD COLUMN tessie_charge_id INTEGER UNIQUE;
ALTER TABLE charges ADD COLUMN created_at_tessie DATETIME; -- Import timestamp from Tessie
ALTER TABLE charges ADD COLUMN is_supercharger BOOLEAN DEFAULT FALSE;
ALTER TABLE charges ADD COLUMN is_fast_charger BOOLEAN DEFAULT FALSE;

-- Add medium-priority analytics fields
ALTER TABLE charges ADD COLUMN miles_added REAL DEFAULT 0; -- Tesla's calculation
ALTER TABLE charges ADD COLUMN since_last_charge REAL DEFAULT 0; -- Time since last charge

-- =====================================================
-- ENHANCED VEHICLE STATE TABLE (Add 9 critical fields)
-- =====================================================

-- Add missing high-priority vehicle state fields
ALTER TABLE vehicle_state ADD COLUMN car_version TEXT; -- Software tracking
ALTER TABLE vehicle_state ADD COLUMN pack_current REAL; -- Battery health
ALTER TABLE vehicle_state ADD COLUMN pack_voltage REAL; -- Battery health
ALTER TABLE vehicle_state ADD COLUMN energy_remaining REAL; -- kWh available

-- Add medium-priority monitoring fields
ALTER TABLE vehicle_state ADD COLUMN sentry_mode BOOLEAN DEFAULT FALSE;
ALTER TABLE vehicle_state ADD COLUMN tpms_pressure_fl REAL; -- Tire pressure front left
ALTER TABLE vehicle_state ADD COLUMN tpms_pressure_fr REAL; -- Tire pressure front right
ALTER TABLE vehicle_state ADD COLUMN tpms_pressure_rl REAL; -- Tire pressure rear left
ALTER TABLE vehicle_state ADD COLUMN tpms_pressure_rr REAL; -- Tire pressure rear right
ALTER TABLE vehicle_state ADD COLUMN lifetime_energy_used REAL; -- Total consumption tracking

-- =====================================================
-- NEW BATTERY HEALTH TABLE (Critical for long trips)
-- =====================================================

CREATE TABLE IF NOT EXISTS battery_health (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id TEXT NOT NULL,
  timestamp DATETIME NOT NULL,
  battery_level INTEGER NOT NULL,
  pack_current REAL,
  pack_voltage REAL,
  energy_remaining REAL,
  lifetime_energy_used REAL,
  module_temp_min INTEGER,
  module_temp_max INTEGER,
  charging_state TEXT,
  range_estimate REAL,
  degradation_percent REAL, -- Calculated field
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

-- =====================================================
-- NEW VEHICLE CONFIGURATION TABLE (Static data)
-- =====================================================

CREATE TABLE IF NOT EXISTS vehicle_configuration (
  vehicle_id TEXT PRIMARY KEY,
  model TEXT,
  trim TEXT,
  year INTEGER,
  color_code TEXT,
  wheel_type TEXT,
  autopilot_version TEXT,
  hardware_version TEXT,
  battery_type TEXT,
  drivetrain TEXT, -- AWD, RWD, etc.
  performance_package BOOLEAN DEFAULT FALSE,
  tow_package BOOLEAN DEFAULT FALSE,
  premium_interior BOOLEAN DEFAULT FALSE,
  full_self_driving BOOLEAN DEFAULT FALSE,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

-- =====================================================
-- NEW SUPERCHARGER NETWORK TABLE (Charging intelligence)
-- =====================================================

CREATE TABLE IF NOT EXISTS supercharger_network (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  location_name TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  stall_count INTEGER,
  max_power_kw INTEGER,
  pricing_per_kwh REAL,
  amenities TEXT, -- JSON array of nearby amenities
  last_visited DATETIME,
  total_visits INTEGER DEFAULT 0,
  average_wait_time INTEGER, -- minutes
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ENHANCED INDEXES (Performance optimization)
-- =====================================================

-- Drives indexes for enhanced queries
CREATE INDEX IF NOT EXISTS idx_drives_tessie_id ON drives(tessie_drive_id);
CREATE INDEX IF NOT EXISTS idx_drives_precise_location ON drives(starting_latitude_precise, starting_longitude_precise);
CREATE INDEX IF NOT EXISTS idx_drives_odometer_range ON drives(starting_odometer, ending_odometer);
CREATE INDEX IF NOT EXISTS idx_drives_temperature ON drives(average_outside_temp);

-- Charges indexes for enhanced queries  
CREATE INDEX IF NOT EXISTS idx_charges_tessie_id ON charges(tessie_charge_id);
CREATE INDEX IF NOT EXISTS idx_charges_supercharger ON charges(is_supercharger, is_fast_charger);
CREATE INDEX IF NOT EXISTS idx_charges_miles_added ON charges(miles_added);

-- Vehicle state indexes for monitoring
CREATE INDEX IF NOT EXISTS idx_vehicle_state_battery_health ON vehicle_state(pack_current, pack_voltage);
CREATE INDEX IF NOT EXISTS idx_vehicle_state_software ON vehicle_state(car_version);
CREATE INDEX IF NOT EXISTS idx_vehicle_state_tire_pressure ON vehicle_state(tpms_pressure_fl, tpms_pressure_fr);

-- Battery health indexes
CREATE INDEX IF NOT EXISTS idx_battery_health_timestamp ON battery_health(vehicle_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_battery_health_degradation ON battery_health(degradation_percent);

-- =====================================================
-- ENHANCED VIEWS (Component-optimized with new data)
-- =====================================================

-- Enhanced Overview with battery health
CREATE VIEW IF NOT EXISTS enhanced_overview_data AS
SELECT 
  j.id as journey_id,
  j.name,
  j.start_date,
  j.status,
  
  -- Enhanced vehicle state
  vs.battery_level,
  vs.battery_range,
  vs.charging_state,
  vs.odometer,
  vs.state_name as current_state,
  vs.city as current_city,
  vs.timestamp as last_update,
  vs.car_version,
  vs.sentry_mode,
  
  -- Battery health metrics
  vs.pack_current,
  vs.pack_voltage,
  vs.energy_remaining,
  vs.lifetime_energy_used,
  
  -- Enhanced journey aggregates
  (SELECT COUNT(*) FROM states_visited WHERE journey_id = j.id) as states_visited,
  (SELECT COUNT(*) FROM drives WHERE journey_id = j.id) as total_drives,
  (SELECT COUNT(*) FROM charges WHERE journey_id = j.id) as total_charges,
  (SELECT COALESCE(SUM(odometer_distance), 0) FROM drives WHERE journey_id = j.id) as total_miles,
  (SELECT COUNT(*) FROM charges WHERE journey_id = j.id AND is_supercharger = TRUE) as supercharger_sessions,
  (SELECT COALESCE(SUM(cost_usd), 0) FROM charges WHERE journey_id = j.id) as total_cost,
  
  -- Enhanced efficiency metrics
  (SELECT COALESCE(AVG(efficiency_miles_per_kwh), 0) FROM drives WHERE journey_id = j.id) as avg_efficiency,
  (SELECT COALESCE(SUM(autopilot_distance), 0) FROM drives WHERE journey_id = j.id) as total_autopilot_miles,
  
  -- Trip duration
  (julianday('now') - julianday(j.start_date)) as days_elapsed

FROM journeys j
LEFT JOIN vehicle_state vs ON vs.vehicle_id = j.vehicle_id;

-- Enhanced Timeline with precise locations
CREATE VIEW IF NOT EXISTS enhanced_timeline_data AS
SELECT 
  'drive' as event_type,
  d.id,
  d.started_at as timestamp,
  d.start_address as location,
  d.end_address as destination,
  d.odometer_distance as primary_metric,
  'miles' as metric_unit,
  COALESCE(d.starting_latitude_precise, d.start_latitude) as latitude,
  COALESCE(d.starting_longitude_precise, d.start_longitude) as longitude,
  d.start_state as state_name,
  json_object(
    'duration', d.duration_minutes,
    'energyUsed', d.energy_used,
    'avgSpeed', d.average_speed,
    'efficiency', d.efficiency_miles_per_kwh,
    'autopilotDistance', d.autopilot_distance,
    'avgInsideTemp', d.average_inside_temp,
    'avgOutsideTemp', d.average_outside_temp,
    'ratedRangeUsed', d.rated_range_used,
    'startingOdometer', d.starting_odometer,
    'endingOdometer', d.ending_odometer
  ) as details
FROM drives d
WHERE d.journey_id = 'continental-usa-2025'

UNION ALL

SELECT 
  'charge' as event_type,
  c.id,
  c.started_at as timestamp,
  c.location,
  CASE 
    WHEN c.is_supercharger THEN 'Supercharger'
    WHEN c.is_fast_charger THEN 'Fast Charger'
    ELSE c.charger_type 
  END as destination,
  c.energy_added as primary_metric,
  'kWh' as metric_unit,
  c.latitude,
  c.longitude,
  c.state_name,
  json_object(
    'duration', c.duration_minutes,
    'cost', c.cost_usd,
    'chargerPower', c.charger_power_kw,
    'batteryStart', c.start_battery_level,
    'batteryEnd', c.end_battery_level,
    'isSupercharger', c.is_supercharger,
    'isFastCharger', c.is_fast_charger,
    'milesAdded', c.miles_added,
    'sinceLastCharge', c.since_last_charge
  ) as details
FROM charges c
WHERE c.journey_id = 'continental-usa-2025'

ORDER BY timestamp DESC;

-- =====================================================
-- ENHANCED TRIGGERS (Data validation and calculations)
-- =====================================================

-- Enhanced drive efficiency with new fields
CREATE TRIGGER IF NOT EXISTS enhanced_drive_efficiency 
AFTER INSERT ON drives
BEGIN
  UPDATE drives 
  SET efficiency_miles_per_kwh = 
    CASE 
      WHEN NEW.energy_used > 0 
      THEN ROUND(NEW.odometer_distance / NEW.energy_used, 2)
      ELSE 0 
    END
  WHERE id = NEW.id;
  
  -- Calculate actual distance from odometer if available
  UPDATE drives
  SET odometer_distance = COALESCE(NEW.ending_odometer - NEW.starting_odometer, NEW.odometer_distance)
  WHERE id = NEW.id AND NEW.starting_odometer > 0 AND NEW.ending_odometer > 0;
END;

-- Battery health tracking trigger
CREATE TRIGGER IF NOT EXISTS track_battery_health
AFTER UPDATE ON vehicle_state
BEGIN
  INSERT INTO battery_health (
    vehicle_id, timestamp, battery_level, pack_current, pack_voltage,
    energy_remaining, lifetime_energy_used, charging_state, range_estimate
  )
  VALUES (
    NEW.vehicle_id, NEW.timestamp, NEW.battery_level, NEW.pack_current, NEW.pack_voltage,
    NEW.energy_remaining, NEW.lifetime_energy_used, NEW.charging_state, NEW.battery_range
  );
END;

-- Enhanced cache clearing with new components
CREATE TRIGGER IF NOT EXISTS enhanced_cache_clear_drives 
AFTER INSERT ON drives
BEGIN
  DELETE FROM component_cache 
  WHERE journey_id = NEW.journey_id 
  AND component_name IN ('overview', 'timeline', 'map', 'battery-health');
END;

CREATE TRIGGER IF NOT EXISTS enhanced_cache_clear_charges 
AFTER INSERT ON charges
BEGIN
  DELETE FROM component_cache 
  WHERE journey_id = NEW.journey_id 
  AND component_name IN ('overview', 'timeline', 'charging-network');
END;
