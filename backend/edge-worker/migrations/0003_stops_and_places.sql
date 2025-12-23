-- Dynamic Stops and Places Schema
-- Stores vehicle stops with dynamically-detected place info and AI-inferred activities

PRAGMA foreign_keys = ON;

-- Stops table - records where the vehicle stopped and what happened
CREATE TABLE IF NOT EXISTS stops (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  journey_id TEXT,
  vehicle_id TEXT,
  
  -- Timing
  arrived_at DATETIME NOT NULL,
  departed_at DATETIME,
  duration_minutes INTEGER,
  
  -- Location
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  
  -- Place info (dynamically detected)
  place_name TEXT,
  place_type TEXT,              -- e.g., "golf_course", "restaurant" (AI-classified)
  place_description TEXT,       -- e.g., "18-hole championship course"
  address TEXT,
  city TEXT,
  state_name TEXT,
  country TEXT,
  
  -- Activity inference (AI-generated)
  inferred_activity TEXT,       -- e.g., "Played 18 holes of golf"
  activity_confidence REAL DEFAULT 0,
  activity_reasoning TEXT,      -- AI's reasoning for the inference
  
  -- Detection metadata
  detection_source TEXT DEFAULT 'geocode',  -- 'geocode', 'search', 'ai', 'user_defined'
  detection_confidence REAL DEFAULT 0,
  raw_geocode_data TEXT,        -- JSON blob for debugging
  raw_search_data TEXT,         -- JSON blob for debugging
  
  -- Flags
  is_overnight INTEGER DEFAULT 0,
  is_likely_home INTEGER DEFAULT 0,
  is_likely_work INTEGER DEFAULT 0,
  is_charging INTEGER DEFAULT 0,
  
  -- User corrections
  user_corrected INTEGER DEFAULT 0,
  user_corrected_at DATETIME,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Known places - user-defined or frequently visited locations
CREATE TABLE IF NOT EXISTS known_places (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  name TEXT NOT NULL,
  category TEXT,                -- User-defined category
  description TEXT,
  is_favorite INTEGER DEFAULT 0,
  is_home INTEGER DEFAULT 0,
  is_work INTEGER DEFAULT 0,
  visit_count INTEGER DEFAULT 0,
  total_time_minutes INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(latitude, longitude)   -- Rounded to ~11m precision
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_stops_journey ON stops(journey_id);
CREATE INDEX IF NOT EXISTS idx_stops_time ON stops(arrived_at DESC);
CREATE INDEX IF NOT EXISTS idx_stops_location ON stops(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_stops_place_type ON stops(place_type);
CREATE INDEX IF NOT EXISTS idx_stops_activity ON stops(inferred_activity);
CREATE INDEX IF NOT EXISTS idx_known_places_location ON known_places(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_known_places_category ON known_places(category);

