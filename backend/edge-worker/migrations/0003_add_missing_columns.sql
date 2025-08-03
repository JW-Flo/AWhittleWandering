-- Add missing columns to existing tables
ALTER TABLE journeys ADD COLUMN states_visited INTEGER DEFAULT 0;

-- Create vehicle_states table if it doesn't exist (for the data ingestion)
CREATE TABLE IF NOT EXISTS vehicle_states (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vin TEXT NOT NULL,
  timestamp TEXT NOT NULL,
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
  locked BOOLEAN DEFAULT FALSE,
  climate_on BOOLEAN DEFAULT FALSE,
  raw_data TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_vehicle_states_vin_timestamp ON vehicle_states(vin, timestamp);
