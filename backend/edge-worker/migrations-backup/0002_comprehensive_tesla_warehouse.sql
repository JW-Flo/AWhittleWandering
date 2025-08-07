-- COMPREHENSIVE TESLA DATA WAREHOUSE
-- Captures ALL available Tessie data with intelligent parsing and automation triggers
-- Organized for maximum utility and automation potential

PRAGMA foreign_keys = ON;

-- =====================================================
-- CORE VEHICLE DATA (Static and Configuration)
-- =====================================================

-- Enhanced Vehicles table with full configuration
CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  tessie_id INTEGER UNIQUE,
  vin TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  color TEXT,
  color_code TEXT,
  trim_level TEXT,
  wheel_type TEXT,
  battery_type TEXT, -- Standard Range, Long Range, Performance
  drivetrain TEXT, -- RWD, AWD
  autopilot_version TEXT,
  hardware_version TEXT,
  performance_package BOOLEAN DEFAULT FALSE,
  tow_package BOOLEAN DEFAULT FALSE,
  premium_interior BOOLEAN DEFAULT FALSE,
  full_self_driving BOOLEAN DEFAULT FALSE,
  supercharging_enabled BOOLEAN DEFAULT TRUE,
  access_type TEXT, -- OWNER, DRIVER
  in_service BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- COMPREHENSIVE VEHICLE STATE (Real-time data)
-- =====================================================

CREATE TABLE IF NOT EXISTS vehicle_state_comprehensive (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id TEXT NOT NULL,
  timestamp DATETIME NOT NULL,
  
  -- Location & Navigation
  latitude REAL DEFAULT 0,
  longitude REAL DEFAULT 0,
  heading INTEGER DEFAULT 0,
  speed REAL DEFAULT 0,
  shift_state TEXT,
  gps_timestamp DATETIME,
  native_location_supported BOOLEAN DEFAULT FALSE,
  
  -- Active Route (Automation potential)
  active_route_destination TEXT,
  active_route_latitude REAL,
  active_route_longitude REAL,
  active_route_miles_to_arrival REAL,
  active_route_minutes_to_arrival INTEGER,
  active_route_traffic_delay INTEGER,
  
  -- Battery & Charging
  battery_level INTEGER DEFAULT 0,
  battery_range REAL DEFAULT 0,
  est_battery_range REAL DEFAULT 0,
  ideal_battery_range REAL DEFAULT 0,
  usable_battery_level INTEGER DEFAULT 0,
  charging_state TEXT DEFAULT 'Disconnected',
  charge_rate REAL DEFAULT 0,
  charge_energy_added REAL DEFAULT 0,
  charge_miles_added REAL DEFAULT 0,
  charger_voltage INTEGER DEFAULT 0,
  charger_actual_current INTEGER DEFAULT 0,
  charger_pilot_current INTEGER DEFAULT 0,
  charger_power INTEGER DEFAULT 0,
  charger_phases INTEGER DEFAULT 0,
  charge_port_door_open BOOLEAN DEFAULT FALSE,
  charge_port_latch TEXT,
  charge_current_request INTEGER DEFAULT 0,
  charge_current_request_max INTEGER DEFAULT 0,
  charge_limit_soc INTEGER DEFAULT 80,
  charge_limit_soc_max INTEGER DEFAULT 100,
  charge_limit_soc_min INTEGER DEFAULT 50,
  minutes_to_full_charge INTEGER DEFAULT 0,
  time_to_full_charge REAL DEFAULT 0,
  
  -- Battery Health & Technical
  pack_current REAL,
  pack_voltage REAL,
  energy_remaining REAL,
  lifetime_energy_used REAL,
  battery_heater_on BOOLEAN DEFAULT FALSE,
  module_temp_min INTEGER,
  module_temp_max INTEGER,
  
  -- Climate & Comfort
  inside_temp REAL,
  outside_temp REAL,
  driver_temp_setting REAL,
  passenger_temp_setting REAL,
  is_climate_on BOOLEAN DEFAULT FALSE,
  is_auto_conditioning_on BOOLEAN DEFAULT FALSE,
  is_preconditioning BOOLEAN DEFAULT FALSE,
  fan_status INTEGER DEFAULT 0,
  is_front_defroster_on BOOLEAN DEFAULT FALSE,
  is_rear_defroster_on BOOLEAN DEFAULT FALSE,
  cabin_overheat_protection TEXT DEFAULT 'Off',
  cabin_overheat_protection_actively_cooling BOOLEAN DEFAULT FALSE,
  climate_keeper_mode TEXT DEFAULT 'off',
  
  -- Seat & Steering Wheel
  seat_heater_left INTEGER DEFAULT 0,
  seat_heater_right INTEGER DEFAULT 0,
  seat_heater_rear_left INTEGER DEFAULT 0,
  seat_heater_rear_right INTEGER DEFAULT 0,
  seat_heater_rear_center INTEGER DEFAULT 0,
  steering_wheel_heater BOOLEAN DEFAULT FALSE,
  steering_wheel_heat_level INTEGER DEFAULT 0,
  
  -- Vehicle Security & Access
  locked BOOLEAN DEFAULT FALSE,
  sentry_mode BOOLEAN DEFAULT FALSE,
  sentry_mode_available BOOLEAN DEFAULT TRUE,
  valet_mode BOOLEAN DEFAULT FALSE,
  remote_start BOOLEAN DEFAULT FALSE,
  is_user_present BOOLEAN DEFAULT FALSE,
  homelink_nearby BOOLEAN DEFAULT FALSE,
  homelink_device_count INTEGER DEFAULT 0,
  
  -- Tire Pressure Monitoring (TPMS)
  tpms_pressure_fl REAL, -- Front Left
  tpms_pressure_fr REAL, -- Front Right  
  tpms_pressure_rl REAL, -- Rear Left
  tpms_pressure_rr REAL, -- Rear Right
  tpms_hard_warning_fl BOOLEAN DEFAULT FALSE,
  tpms_hard_warning_fr BOOLEAN DEFAULT FALSE,
  tpms_hard_warning_rl BOOLEAN DEFAULT FALSE,
  tpms_hard_warning_rr BOOLEAN DEFAULT FALSE,
  tpms_soft_warning_fl BOOLEAN DEFAULT FALSE,
  tpms_soft_warning_fr BOOLEAN DEFAULT FALSE,
  tpms_soft_warning_rl BOOLEAN DEFAULT FALSE,
  tpms_soft_warning_rr BOOLEAN DEFAULT FALSE,
  
  -- Vehicle Status & Diagnostics
  odometer REAL DEFAULT 0,
  car_version TEXT,
  api_version INTEGER,
  center_display_state INTEGER DEFAULT 0,
  dashcam_state TEXT DEFAULT 'Unavailable',
  dashcam_clip_save_available BOOLEAN DEFAULT FALSE,
  service_mode BOOLEAN DEFAULT FALSE,
  vehicle_self_test_requested BOOLEAN DEFAULT FALSE,
  vehicle_self_test_progress INTEGER DEFAULT 0,
  
  -- Door & Window Status (Automation triggers)
  df INTEGER DEFAULT 0, -- Driver Front
  dr INTEGER DEFAULT 0, -- Driver Rear
  pf INTEGER DEFAULT 0, -- Passenger Front
  pr INTEGER DEFAULT 0, -- Passenger Rear
  ft INTEGER DEFAULT 0, -- Front Trunk
  rt INTEGER DEFAULT 0, -- Rear Trunk
  fd_window INTEGER DEFAULT 0, -- Front Driver Window
  fp_window INTEGER DEFAULT 0, -- Front Passenger Window
  rd_window INTEGER DEFAULT 0, -- Rear Driver Window
  rp_window INTEGER DEFAULT 0, -- Rear Passenger Window
  
  -- Scheduled Operations (Automation data)
  scheduled_charging_pending BOOLEAN DEFAULT FALSE,
  scheduled_charging_start_time DATETIME,
  scheduled_departure_time DATETIME,
  off_peak_charging_enabled BOOLEAN DEFAULT FALSE,
  preconditioning_enabled BOOLEAN DEFAULT FALSE,
  
  -- Supercharger & Network
  supercharger_session_trip_planner BOOLEAN DEFAULT FALSE,
  fast_charger_present BOOLEAN DEFAULT FALSE,
  fast_charger_brand TEXT,
  fast_charger_type TEXT,
  
  -- Parsed Location Intelligence (Our processing)
  parsed_address TEXT,
  parsed_city TEXT,
  parsed_state TEXT,
  parsed_country TEXT,
  parsed_location_type TEXT, -- 'home', 'supercharger', 'destination', 'unknown'
  is_home_location BOOLEAN DEFAULT FALSE,
  is_overnight_location BOOLEAN DEFAULT FALSE,
  location_category TEXT, -- 'residential', 'commercial', 'highway', 'rural'
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

-- =====================================================
-- COMPREHENSIVE DRIVES DATA
-- =====================================================

CREATE TABLE IF NOT EXISTS drives_comprehensive (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tessie_drive_id INTEGER UNIQUE NOT NULL,
  vehicle_id TEXT NOT NULL,
  journey_id TEXT NOT NULL,
  
  -- Timing
  started_at DATETIME NOT NULL,
  ended_at DATETIME NOT NULL,
  created_at_tessie DATETIME,
  duration_minutes INTEGER DEFAULT 0,
  
  -- Locations (Raw and Parsed)
  starting_location TEXT,
  ending_location TEXT,
  starting_latitude REAL DEFAULT 0,
  starting_longitude REAL DEFAULT 0,
  ending_latitude REAL DEFAULT 0,
  ending_longitude REAL DEFAULT 0,
  
  -- Parsed Start Location Intelligence
  start_parsed_address TEXT,
  start_parsed_city TEXT,
  start_parsed_state TEXT,
  start_parsed_country TEXT,
  start_location_type TEXT, -- 'home', 'hotel', 'supercharger', 'destination', 'unknown'
  start_is_overnight_location BOOLEAN DEFAULT FALSE,
  
  -- Parsed End Location Intelligence
  end_parsed_address TEXT,
  end_parsed_city TEXT,
  end_parsed_state TEXT,
  end_parsed_country TEXT,
  end_location_type TEXT,
  end_is_overnight_location BOOLEAN DEFAULT FALSE,
  
  -- Distance & Odometer
  odometer_distance REAL DEFAULT 0,
  starting_odometer REAL DEFAULT 0,
  ending_odometer REAL DEFAULT 0,
  calculated_distance REAL DEFAULT 0, -- From coordinates
  
  -- Energy & Efficiency
  energy_used REAL DEFAULT 0,
  rated_range_used REAL DEFAULT 0,
  ideal_range_used REAL DEFAULT 0,
  efficiency_miles_per_kwh REAL DEFAULT 0,
  
  -- Speed & Performance
  average_speed REAL DEFAULT 0,
  max_speed REAL DEFAULT 0,
  
  -- Battery
  starting_battery REAL DEFAULT 0,
  ending_battery REAL DEFAULT 0,
  battery_consumed REAL DEFAULT 0,
  
  -- Environmental
  average_inside_temperature REAL,
  average_outside_temperature REAL,
  weather_conditions TEXT, -- To be populated by weather API
  
  -- Autopilot & Driving Assistance
  autopilot_distance REAL DEFAULT 0,
  autopilot_percentage REAL DEFAULT 0, -- Calculated
  
  -- Drive Classification (Our intelligence)
  drive_type TEXT, -- 'commute', 'road_trip', 'local', 'charging_move'
  is_round_trip BOOLEAN DEFAULT FALSE,
  is_state_crossing BOOLEAN DEFAULT FALSE,
  is_long_distance BOOLEAN DEFAULT FALSE, -- >100 miles
  is_highway_drive BOOLEAN DEFAULT FALSE,
  
  -- Automation Triggers
  triggered_charging_stop BOOLEAN DEFAULT FALSE,
  triggered_overnight_stay BOOLEAN DEFAULT FALSE,
  triggered_state_visit BOOLEAN DEFAULT FALSE,
  triggered_milestone_alert BOOLEAN DEFAULT FALSE,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  FOREIGN KEY (journey_id) REFERENCES journeys(id)
);

-- =====================================================
-- COMPREHENSIVE CHARGES DATA
-- =====================================================

CREATE TABLE IF NOT EXISTS charges_comprehensive (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tessie_charge_id INTEGER UNIQUE NOT NULL,
  vehicle_id TEXT NOT NULL,
  journey_id TEXT NOT NULL,
  
  -- Timing
  started_at DATETIME NOT NULL,
  ended_at DATETIME,
  created_at_tessie DATETIME,
  duration_minutes INTEGER DEFAULT 0,
  
  -- Location (Raw and Parsed)
  location TEXT,
  latitude REAL DEFAULT 0,
  longitude REAL DEFAULT 0,
  parsed_address TEXT,
  parsed_city TEXT,
  parsed_state TEXT,
  parsed_country TEXT,
  
  -- Charger Classification
  charger_type TEXT,
  is_supercharger BOOLEAN DEFAULT FALSE,
  is_fast_charger BOOLEAN DEFAULT FALSE,
  charger_power_kw REAL DEFAULT 0,
  charger_network TEXT, -- 'Tesla Supercharger', 'Electrify America', 'ChargePoint', etc.
  charger_location_type TEXT, -- 'highway', 'destination', 'urban', 'home'
  
  -- Energy & Battery
  energy_added REAL DEFAULT 0,
  energy_used REAL DEFAULT 0, -- Charging losses
  miles_added REAL DEFAULT 0,
  miles_added_ideal REAL DEFAULT 0,
  starting_battery REAL DEFAULT 0,
  ending_battery REAL DEFAULT 0,
  battery_gained REAL DEFAULT 0,
  
  -- Charging Performance
  peak_charging_rate REAL DEFAULT 0,
  average_charging_rate REAL DEFAULT 0,
  charging_efficiency REAL DEFAULT 0, -- energy_added / energy_used
  
  -- Cost & Pricing
  cost_usd REAL DEFAULT 0,
  cost_per_kwh REAL DEFAULT 0,
  cost_per_minute REAL DEFAULT 0,
  pricing_model TEXT, -- 'per_kwh', 'per_minute', 'free', 'subscription'
  
  -- Vehicle State During Charging
  odometer REAL DEFAULT 0,
  since_last_charge REAL DEFAULT 0,
  climate_on_during_charge BOOLEAN DEFAULT FALSE,
  sentry_mode_during_charge BOOLEAN DEFAULT FALSE,
  
  -- Charging Session Intelligence (Our processing)
  charge_session_type TEXT, -- 'top_up', 'travel_charge', 'destination_charge', 'emergency'
  is_planned_stop BOOLEAN DEFAULT FALSE,
  is_overnight_charge BOOLEAN DEFAULT FALSE,
  is_opportunity_charge BOOLEAN DEFAULT FALSE,
  wait_time_minutes INTEGER DEFAULT 0,
  
  -- Automation Triggers
  triggered_departure_alert BOOLEAN DEFAULT FALSE,
  triggered_cost_alert BOOLEAN DEFAULT FALSE,
  triggered_full_charge_alert BOOLEAN DEFAULT FALSE,
  triggered_social_share BOOLEAN DEFAULT FALSE,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  FOREIGN KEY (journey_id) REFERENCES journeys(id)
);

-- =====================================================
-- INTELLIGENT LOCATION TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS locations_intelligence (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  
  -- Parsed Address Components
  formatted_address TEXT,
  street_number TEXT,
  route TEXT,
  city TEXT,
  state TEXT,
  state_code TEXT,
  country TEXT,
  postal_code TEXT,
  
  -- Location Classification
  location_type TEXT, -- 'home', 'hotel', 'supercharger', 'destination', 'restaurant', 'shopping'
  location_category TEXT, -- 'residential', 'commercial', 'highway', 'rural', 'urban'
  location_subcategory TEXT,
  
  -- Visit Analytics
  total_visits INTEGER DEFAULT 1,
  first_visited DATETIME,
  last_visited DATETIME,
  average_stay_duration INTEGER, -- minutes
  
  -- Charging Information (if applicable)
  has_charging BOOLEAN DEFAULT FALSE,
  charging_networks TEXT, -- JSON array of available networks
  charging_speed TEXT, -- 'slow', 'fast', 'superfast'
  charging_cost_estimate REAL,
  
  -- Amenities & POI Data
  nearby_amenities TEXT, -- JSON array of restaurants, hotels, shopping
  google_place_id TEXT,
  yelp_rating REAL,
  google_rating REAL,
  
  -- Automation Metadata
  is_home_location BOOLEAN DEFAULT FALSE,
  is_frequent_stop BOOLEAN DEFAULT FALSE,
  is_charging_destination BOOLEAN DEFAULT FALSE,
  is_overnight_location BOOLEAN DEFAULT FALSE,
  
  -- Weather Integration
  typical_weather TEXT, -- JSON object with seasonal weather data
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- STATE VISIT TRACKING (Enhanced)
-- =====================================================

CREATE TABLE IF NOT EXISTS states_visited_comprehensive (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  journey_id TEXT NOT NULL,
  state_name TEXT NOT NULL,
  state_code TEXT,
  
  -- Visit Timeline
  first_entered DATETIME,
  last_exited DATETIME,
  total_visits INTEGER DEFAULT 1,
  current_visit_start DATETIME,
  is_currently_in_state BOOLEAN DEFAULT FALSE,
  
  -- Distance & Time Analytics
  total_miles_in_state REAL DEFAULT 0,
  total_time_in_state INTEGER DEFAULT 0, -- minutes
  average_speed_in_state REAL DEFAULT 0,
  
  -- Activity Breakdown
  drives_in_state INTEGER DEFAULT 0,
  charges_in_state INTEGER DEFAULT 0,
  overnight_stays_in_state INTEGER DEFAULT 0,
  
  -- Energy & Cost in State
  energy_used_in_state REAL DEFAULT 0,
  energy_added_in_state REAL DEFAULT 0,
  charging_cost_in_state REAL DEFAULT 0,
  
  -- Points of Interest
  cities_visited TEXT, -- JSON array of cities
  charging_locations TEXT, -- JSON array of charging stops
  overnight_locations TEXT, -- JSON array of hotels/stays
  
  -- State Completion Status
  visit_status TEXT DEFAULT 'in_progress', -- 'completed', 'in_progress', 'transit'
  completion_percentage REAL DEFAULT 0, -- Based on major cities/attractions
  
  -- Automation Triggers
  triggered_entry_notification BOOLEAN DEFAULT FALSE,
  triggered_exit_notification BOOLEAN DEFAULT FALSE,
  triggered_completion_celebration BOOLEAN DEFAULT FALSE,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (journey_id) REFERENCES journeys(id),
  UNIQUE(journey_id, state_name)
);

-- =====================================================
-- AUTOMATION TRIGGERS & RULES
-- =====================================================

CREATE TABLE IF NOT EXISTS automation_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rule_name TEXT UNIQUE NOT NULL,
  rule_type TEXT NOT NULL, -- 'location', 'battery', 'charging', 'time', 'distance', 'state'
  
  -- Trigger Conditions (JSON)
  trigger_conditions TEXT NOT NULL, -- JSON object with conditions
  
  -- Actions (JSON)
  actions TEXT NOT NULL, -- JSON array of actions to take
  
  -- Rule Status
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 5, -- 1-10, higher is more important
  
  -- Execution Tracking
  total_triggers INTEGER DEFAULT 0,
  last_triggered DATETIME,
  
  -- Rule Configuration
  cooldown_minutes INTEGER DEFAULT 60, -- Prevent spam
  max_triggers_per_day INTEGER DEFAULT 10,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- AUTOMATION EXECUTION LOG
-- =====================================================

CREATE TABLE IF NOT EXISTS automation_executions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rule_id INTEGER NOT NULL,
  rule_name TEXT NOT NULL,
  
  -- Trigger Context
  trigger_type TEXT NOT NULL,
  trigger_data TEXT, -- JSON with trigger context
  
  -- Execution Details
  actions_executed TEXT, -- JSON array of executed actions
  execution_status TEXT DEFAULT 'success', -- 'success', 'failed', 'partial'
  execution_duration_ms INTEGER,
  error_message TEXT,
  
  -- Context Data
  vehicle_id TEXT,
  journey_id TEXT,
  location_latitude REAL,
  location_longitude REAL,
  battery_level INTEGER,
  charging_state TEXT,
  
  executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rule_id) REFERENCES automation_rules(id)
);

-- =====================================================
-- OVERNIGHT STAYS TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS overnight_stays (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id TEXT NOT NULL,
  journey_id TEXT NOT NULL,
  
  -- Location
  location TEXT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  parsed_address TEXT,
  parsed_city TEXT,
  parsed_state TEXT,
  
  -- Stay Details
  arrival_time DATETIME NOT NULL,
  departure_time DATETIME,
  duration_hours REAL,
  stay_type TEXT, -- 'hotel', 'home', 'friend', 'camping', 'unknown'
  
  -- Vehicle State During Stay
  arrival_battery_level INTEGER,
  departure_battery_level INTEGER,
  charged_during_stay BOOLEAN DEFAULT FALSE,
  charging_session_id INTEGER, -- Reference to charge session
  
  -- Stay Classification
  is_planned_stay BOOLEAN DEFAULT FALSE,
  is_emergency_stay BOOLEAN DEFAULT FALSE,
  accommodation_type TEXT, -- 'hotel', 'airbnb', 'camping', 'residential'
  
  -- Cost & Booking
  accommodation_cost REAL,
  booking_reference TEXT,
  
  -- Automation Triggers
  triggered_arrival_notification BOOLEAN DEFAULT FALSE,
  triggered_departure_preparation BOOLEAN DEFAULT FALSE,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  FOREIGN KEY (journey_id) REFERENCES journeys(id),
  FOREIGN KEY (charging_session_id) REFERENCES charges_comprehensive(id)
);

-- =====================================================
-- COMPREHENSIVE INDEXES (Performance Optimization)
-- =====================================================

-- Vehicle State Indexes
CREATE INDEX IF NOT EXISTS idx_vehicle_state_timestamp ON vehicle_state_comprehensive(vehicle_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_state_location ON vehicle_state_comprehensive(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_vehicle_state_charging ON vehicle_state_comprehensive(charging_state, battery_level);
CREATE INDEX IF NOT EXISTS idx_vehicle_state_automation ON vehicle_state_comprehensive(is_home_location, is_overnight_location);

-- Drives Indexes
CREATE INDEX IF NOT EXISTS idx_drives_tessie_id ON drives_comprehensive(tessie_drive_id);
CREATE INDEX IF NOT EXISTS idx_drives_journey_date ON drives_comprehensive(journey_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_drives_locations ON drives_comprehensive(starting_latitude, starting_longitude, ending_latitude, ending_longitude);
CREATE INDEX IF NOT EXISTS idx_drives_classification ON drives_comprehensive(drive_type, is_state_crossing);
CREATE INDEX IF NOT EXISTS idx_drives_automation ON drives_comprehensive(triggered_charging_stop, triggered_overnight_stay);

-- Charges Indexes
CREATE INDEX IF NOT EXISTS idx_charges_tessie_id ON charges_comprehensive(tessie_charge_id);
CREATE INDEX IF NOT EXISTS idx_charges_journey_date ON charges_comprehensive(journey_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_charges_location ON charges_comprehensive(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_charges_network ON charges_comprehensive(is_supercharger, charger_network);
CREATE INDEX IF NOT EXISTS idx_charges_cost ON charges_comprehensive(cost_usd, cost_per_kwh);

-- Location Intelligence Indexes
CREATE INDEX IF NOT EXISTS idx_locations_coordinates ON locations_intelligence(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_locations_type ON locations_intelligence(location_type, location_category);
CREATE INDEX IF NOT EXISTS idx_locations_visits ON locations_intelligence(total_visits DESC, last_visited DESC);

-- State Tracking Indexes
CREATE INDEX IF NOT EXISTS idx_states_journey ON states_visited_comprehensive(journey_id, state_name);
CREATE INDEX IF NOT EXISTS idx_states_current ON states_visited_comprehensive(is_currently_in_state, state_name);
CREATE INDEX IF NOT EXISTS idx_states_completion ON states_visited_comprehensive(completion_percentage DESC);

-- Automation Indexes
CREATE INDEX IF NOT EXISTS idx_automation_rules_active ON automation_rules(is_active, rule_type);
CREATE INDEX IF NOT EXISTS idx_automation_executions_rule ON automation_executions(rule_id, executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_automation_executions_vehicle ON automation_executions(vehicle_id, executed_at DESC);

-- Overnight Stays Indexes
CREATE INDEX IF NOT EXISTS idx_overnight_journey_date ON overnight_stays(journey_id, arrival_time DESC);
CREATE INDEX IF NOT EXISTS idx_overnight_location ON overnight_stays(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_overnight_type ON overnight_stays(stay_type, accommodation_type);
