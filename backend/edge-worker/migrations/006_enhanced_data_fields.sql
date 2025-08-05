-- Enhanced Data Fields Migration
-- Add missing Tessie API fields for comprehensive data capture

-- Enhance vehicle_state table with missing fields
ALTER TABLE vehicle_state ADD COLUMN shift_state TEXT;
ALTER TABLE vehicle_state ADD COLUMN power INTEGER; -- kW
ALTER TABLE vehicle_state ADD COLUMN locked BOOLEAN DEFAULT FALSE;
ALTER TABLE vehicle_state ADD COLUMN climate_on BOOLEAN DEFAULT FALSE;
ALTER TABLE vehicle_state ADD COLUMN software_update_status TEXT;
ALTER TABLE vehicle_state ADD COLUMN car_version TEXT;

-- Enhance drives table with missing Tessie fields
ALTER TABLE drives ADD COLUMN max_speed REAL;
ALTER TABLE drives ADD COLUMN rated_range_used REAL;
ALTER TABLE drives ADD COLUMN average_inside_temp REAL;
ALTER TABLE drives ADD COLUMN average_outside_temp REAL;
ALTER TABLE drives ADD COLUMN drive_tag TEXT; -- Personal/Business
ALTER TABLE drives ADD COLUMN starting_range REAL;
ALTER TABLE drives ADD COLUMN ending_range REAL;

-- Enhance charges table with missing Tessie fields  
ALTER TABLE charges ADD COLUMN energy_used_kwh REAL; -- Different from energy_added
ALTER TABLE charges ADD COLUMN miles_added INTEGER;
ALTER TABLE charges ADD COLUMN miles_added_ideal INTEGER;
ALTER TABLE charges ADD COLUMN is_supercharger BOOLEAN DEFAULT FALSE;
ALTER TABLE charges ADD COLUMN charge_port_type TEXT; -- CCS, Tesla, etc.
ALTER TABLE charges ADD COLUMN cost_per_kwh REAL;
ALTER TABLE charges ADD COLUMN peak_charging_rate REAL;

-- Create enhanced analytics tables
CREATE TABLE IF NOT EXISTS drive_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  journey_id TEXT NOT NULL,
  date TEXT NOT NULL, -- YYYY-MM-DD format
  total_drives INTEGER DEFAULT 0,
  total_distance_miles REAL DEFAULT 0,
  total_energy_used_kwh REAL DEFAULT 0,
  avg_speed_mph REAL DEFAULT 0,
  max_speed_mph REAL DEFAULT 0,
  efficiency_miles_per_kwh REAL DEFAULT 0,
  states_visited_count INTEGER DEFAULT 0,
  cities_visited_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (journey_id) REFERENCES journeys(id),
  UNIQUE(journey_id, date)
);

CREATE TABLE IF NOT EXISTS charge_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  journey_id TEXT NOT NULL,
  date TEXT NOT NULL, -- YYYY-MM-DD format
  total_charges INTEGER DEFAULT 0,
  total_energy_added_kwh REAL DEFAULT 0,
  total_cost_usd REAL DEFAULT 0,
  avg_charge_rate_kw REAL DEFAULT 0,
  supercharger_sessions INTEGER DEFAULT 0,
  destination_charges INTEGER DEFAULT 0,
  total_charge_time_minutes INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (journey_id) REFERENCES journeys(id),
  UNIQUE(journey_id, date)
);

-- Create weather data table for enhanced insights
CREATE TABLE IF NOT EXISTS weather_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  recorded_at DATETIME NOT NULL,
  temperature_f REAL,
  temperature_c REAL,
  weather_description TEXT,
  wind_speed_mph REAL,
  humidity_percent INTEGER,
  visibility_miles REAL,
  drive_id INTEGER,
  charge_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (drive_id) REFERENCES drives(id),
  FOREIGN KEY (charge_id) REFERENCES charges(id)
);

-- Create vehicle efficiency tracking
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

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_drive_analytics_journey_date ON drive_analytics(journey_id, date);
CREATE INDEX IF NOT EXISTS idx_charge_analytics_journey_date ON charge_analytics(journey_id, date);
CREATE INDEX IF NOT EXISTS idx_weather_location ON weather_data(latitude, longitude, recorded_at);
CREATE INDEX IF NOT EXISTS idx_efficiency_metrics_journey_date ON efficiency_metrics(journey_id, date);

-- Create vehicle state history table for trend analysis
CREATE TABLE IF NOT EXISTS vehicle_state_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id TEXT NOT NULL,
  battery_level INTEGER,
  battery_range REAL,
  charging_state TEXT,
  latitude REAL,
  longitude REAL,
  speed REAL,
  odometer REAL,
  outside_temp REAL,
  inside_temp REAL,
  power INTEGER, -- kW usage
  recorded_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

CREATE INDEX IF NOT EXISTS idx_vehicle_state_history_vehicle_time ON vehicle_state_history(vehicle_id, recorded_at);
CREATE INDEX IF NOT EXISTS idx_vehicle_state_history_location ON vehicle_state_history(latitude, longitude);
