-- Enhanced D1 Database Schema for Real-Time Tesla Data
-- Optimized for component-based queries and AI/ML processing

-- Vehicle States Table (Real-time current state)
CREATE TABLE IF NOT EXISTS vehicle_states (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vin TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
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
    raw_data TEXT, -- JSON blob for full Tessie response
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    UNIQUE(vin, timestamp)
);

-- Drives Table (Enhanced for component queries)
CREATE TABLE IF NOT EXISTS drives (
    id TEXT PRIMARY KEY,
    journey_id TEXT NOT NULL DEFAULT 'continental-usa-2025',
    vin TEXT NOT NULL,
    started_at DATETIME NOT NULL,
    ended_at DATETIME NOT NULL,
    start_address TEXT,
    end_address TEXT,
    start_latitude REAL DEFAULT 0,
    start_longitude REAL DEFAULT 0,
    end_latitude REAL DEFAULT 0,
    end_longitude REAL DEFAULT 0,
    distance_miles REAL DEFAULT 0,
    duration_minutes INTEGER DEFAULT 0,
    start_battery_level INTEGER DEFAULT 0,
    end_battery_level INTEGER DEFAULT 0,
    energy_used REAL DEFAULT 0,
    outside_temp_avg REAL,
    raw_data TEXT, -- JSON blob for full Tessie response
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- AI/ML ready columns
    efficiency_score REAL, -- Calculated miles per kWh
    route_complexity TEXT, -- urban/highway/mixed
    weather_conditions TEXT, -- derived from temp/external APIs
    
    FOREIGN KEY (journey_id) REFERENCES journeys(id)
);

-- Charges Table (Enhanced for component queries)
CREATE TABLE IF NOT EXISTS charges (
    id TEXT PRIMARY KEY,
    journey_id TEXT NOT NULL DEFAULT 'continental-usa-2025',
    vin TEXT NOT NULL,
    started_at DATETIME NOT NULL,
    ended_at DATETIME NOT NULL,
    location TEXT,
    latitude REAL DEFAULT 0,
    longitude REAL DEFAULT 0,
    energy_added_kwh REAL DEFAULT 0,
    cost_usd REAL DEFAULT 0,
    start_battery_level INTEGER DEFAULT 0,
    end_battery_level INTEGER DEFAULT 0,
    charger_type TEXT, -- Supercharger, Destination, etc.
    charger_power REAL, -- kW rating
    raw_data TEXT, -- JSON blob for full Tessie response
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- AI/ML ready columns
    charging_efficiency REAL, -- Calculated kW average
    cost_per_kwh REAL, -- Calculated $/kWh
    charging_network TEXT, -- Tesla/Electrify America/etc.
    
    FOREIGN KEY (journey_id) REFERENCES journeys(id)
);

-- Journeys Table (Enhanced metadata)
CREATE TABLE IF NOT EXISTS journeys (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    start_date DATETIME,
    end_date DATETIME,
    total_miles REAL DEFAULT 0,
    states_visited INTEGER DEFAULT 0,
    total_drives INTEGER DEFAULT 0,
    total_charges INTEGER DEFAULT 0,
    total_energy_used REAL DEFAULT 0,
    total_charging_cost REAL DEFAULT 0,
    status TEXT DEFAULT 'active',
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- AI/ML analytics
    overall_efficiency REAL, -- Journey-wide miles per kWh
    route_score INTEGER, -- 1-100 route optimization score
    weather_impact TEXT, -- Seasonal analysis
    cost_analysis TEXT -- JSON blob with cost breakdowns
);

-- Performance Indexes for Component Queries
CREATE INDEX IF NOT EXISTS idx_drives_journey_date ON drives(journey_id, started_at);
CREATE INDEX IF NOT EXISTS idx_drives_location ON drives(start_latitude, start_longitude);
CREATE INDEX IF NOT EXISTS idx_drives_efficiency ON drives(efficiency_score);

CREATE INDEX IF NOT EXISTS idx_charges_journey_date ON charges(journey_id, started_at);
CREATE INDEX IF NOT EXISTS idx_charges_location ON charges(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_charges_cost ON charges(cost_per_kwh);

CREATE INDEX IF NOT EXISTS idx_vehicle_states_timestamp ON vehicle_states(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_states_vin ON vehicle_states(vin, timestamp DESC);

-- Views for Component-Optimized Queries

-- Timeline View (Optimized for frontend timeline components)
CREATE VIEW IF NOT EXISTS timeline_events AS
SELECT 
    'drive' as event_type,
    d.id,
    d.started_at as timestamp,
    d.start_address as location,
    d.distance_miles as value,
    'miles' as unit,
    d.start_latitude as latitude,
    d.start_longitude as longitude,
    json_object(
        'endLocation', d.end_address,
        'duration', d.duration_minutes,
        'energyUsed', d.energy_used,
        'efficiency', d.efficiency_score
    ) as metadata
FROM drives d
WHERE d.journey_id = 'continental-usa-2025'

UNION ALL

SELECT 
    'charge' as event_type,
    c.id,
    c.started_at as timestamp,
    c.location,
    c.energy_added_kwh as value,
    'kWh' as unit,
    c.latitude,
    c.longitude,
    json_object(
        'cost', c.cost_usd,
        'duration', (strftime('%s', c.ended_at) - strftime('%s', c.started_at)) / 60,
        'chargerType', c.charger_type,
        'efficiency', c.charging_efficiency
    ) as metadata
FROM charges c
WHERE c.journey_id = 'continental-usa-2025'

ORDER BY timestamp DESC;

-- Statistics View (Optimized for dashboard components)
CREATE VIEW IF NOT EXISTS journey_statistics AS
SELECT 
    j.id,
    j.name,
    j.total_miles,
    j.states_visited,
    j.total_drives,
    j.total_charges,
    j.overall_efficiency,
    
    -- Real-time calculated stats
    (SELECT COUNT(*) FROM drives WHERE journey_id = j.id) as actual_drives,
    (SELECT COUNT(*) FROM charges WHERE journey_id = j.id) as actual_charges,
    (SELECT SUM(distance_miles) FROM drives WHERE journey_id = j.id) as actual_miles,
    (SELECT SUM(cost_usd) FROM charges WHERE journey_id = j.id) as actual_cost,
    
    -- Recent activity (last 24 hours)
    (SELECT COUNT(*) FROM drives WHERE journey_id = j.id AND started_at > datetime('now', '-1 day')) as drives_today,
    (SELECT COUNT(*) FROM charges WHERE journey_id = j.id AND started_at > datetime('now', '-1 day')) as charges_today,
    
    -- Current status
    (SELECT json_object(
        'id', vs.id,
        'vin', vs.vin,
        'timestamp', vs.timestamp,
        'battery_level', vs.battery_level,
        'battery_range', vs.battery_range,
        'charging_state', vs.charging_state,
        'latitude', vs.latitude,
        'longitude', vs.longitude,
        'heading', vs.heading,
        'speed', vs.speed,
        'odometer', vs.odometer,
        'inside_temp', vs.inside_temp,
        'outside_temp', vs.outside_temp,
        'locked', vs.locked,
        'climate_on', vs.climate_on,
        'created_at', vs.created_at
    ) FROM vehicle_states vs WHERE vs.vin = (
        SELECT DISTINCT vin FROM drives WHERE journey_id = j.id LIMIT 1
    ) ORDER BY vs.timestamp DESC LIMIT 1) as current_state
    
FROM journeys j;

-- Data Ingestion Log (For monitoring and debugging)
CREATE TABLE IF NOT EXISTS ingestion_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    operation TEXT NOT NULL, -- 'full_sync', 'vehicle_state', 'drives', 'charges'
    records_processed INTEGER DEFAULT 0,
    success BOOLEAN DEFAULT TRUE,
    errors TEXT, -- JSON array of error messages
    duration_ms INTEGER DEFAULT 0,
    api_calls_made INTEGER DEFAULT 0
);

-- Component Cache Table (For AI/ML processed results)
CREATE TABLE IF NOT EXISTS component_cache (
    id TEXT PRIMARY KEY,
    component_name TEXT NOT NULL, -- 'route_analysis', 'efficiency_trends', etc.
    cache_key TEXT NOT NULL,
    data TEXT NOT NULL, -- JSON processed result
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(component_name, cache_key)
);

-- Triggers for AI/ML data processing
CREATE TRIGGER IF NOT EXISTS calculate_drive_efficiency 
AFTER INSERT ON drives
BEGIN
    UPDATE drives 
    SET efficiency_score = 
        CASE 
            WHEN NEW.energy_used > 0 
            THEN NEW.distance_miles / NEW.energy_used 
            ELSE NULL 
        END
    WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS calculate_charge_efficiency 
AFTER INSERT ON charges
BEGIN
    UPDATE charges 
    SET 
        charging_efficiency = 
            CASE 
                WHEN (strftime('%s', NEW.ended_at) - strftime('%s', NEW.started_at)) > 0 
                THEN NEW.energy_added_kwh / ((strftime('%s', NEW.ended_at) - strftime('%s', NEW.started_at)) / 3600.0)
                ELSE NULL 
            END,
        cost_per_kwh = 
            CASE 
                WHEN NEW.energy_added_kwh > 0 
                THEN NEW.cost_usd / NEW.energy_added_kwh 
                ELSE NULL 
            END
    WHERE id = NEW.id;
END;

-- Initial journey record
INSERT OR IGNORE INTO journeys (id, name, status) 
VALUES ('continental-usa-2025', 'A Whittle Wandering - Continental USA', 'active');
