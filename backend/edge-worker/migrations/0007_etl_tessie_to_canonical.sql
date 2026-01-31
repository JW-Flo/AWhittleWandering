-- Migration: Transform tessie_drives to canonical drives table
-- Date: 2026-01-30
-- Purpose: Populate drives table from raw Tessie telemetry

-- Step 1: Insert drives from tessie_drives (with deduplication)
INSERT OR IGNORE INTO drives (
    tessie_id,
    vehicle_id,
    journey_id,
    started_at,
    ended_at,
    start_address,
    end_address,
    start_latitude,
    start_longitude,
    end_latitude,
    end_longitude,
    start_state,
    end_state,
    distance_miles,
    duration_minutes,
    energy_used_kwh,
    average_speed,
    max_speed,
    start_battery_level,
    end_battery_level,
    average_inside_temp,
    outside_temp_avg,
    efficiency_miles_per_kwh,
    created_at
)
SELECT 
    td.tessie_drive_id as tessie_id,
    'midnight-shadow' as vehicle_id,
    'continental-usa-2025' as journey_id,
    td.started_at,
    td.ended_at,
    td.starting_location,
    td.ending_location,
    td.starting_latitude,
    td.starting_longitude,
    td.ending_latitude,
    td.ending_longitude,
    NULL as start_state,
    NULL as end_state,
    td.odometer_distance as distance_miles,
    CAST((julianday(td.ended_at) - julianday(td.started_at)) * 24 * 60 AS INTEGER) as duration_minutes,
    td.energy_used as energy_used_kwh,
    td.average_speed,
    td.max_speed,
    td.starting_battery as start_battery_level,
    td.ending_battery as end_battery_level,
    td.average_inside_temp,
    td.average_outside_temp as outside_temp_avg,
    CASE 
        WHEN td.energy_used > 0 THEN td.odometer_distance / td.energy_used
        ELSE 0 
    END as efficiency_miles_per_kwh,
    datetime('now') as created_at
FROM tessie_drives td
WHERE td.tessie_drive_id NOT IN (SELECT tessie_id FROM drives WHERE tessie_id IS NOT NULL);

-- Step 2: Update journey aggregates
UPDATE journeys 
SET 
    total_miles = (
        SELECT COALESCE(SUM(distance_miles), 0) 
        FROM drives 
        WHERE journey_id = 'continental-usa-2025'
    ),
    total_drives = (
        SELECT COUNT(*) 
        FROM drives 
        WHERE journey_id = 'continental-usa-2025'
    ),
    total_energy_used_kwh = (
        SELECT COALESCE(SUM(energy_used_kwh), 0) 
        FROM drives 
        WHERE journey_id = 'continental-usa-2025'
    ),
    overall_efficiency_miles_per_kwh = (
        SELECT CASE 
            WHEN SUM(energy_used_kwh) > 0 
            THEN SUM(distance_miles) / SUM(energy_used_kwh)
            ELSE 0 
        END
        FROM drives 
        WHERE journey_id = 'continental-usa-2025'
    ),
    updated_at = datetime('now')
WHERE id = 'continental-usa-2025';

-- Step 3: Populate states_visited from drive locations
INSERT OR IGNORE INTO states_visited (
    journey_id,
    state_name,
    state_code,
    first_visited_date,
    visit_count,
    created_at
)
SELECT 
    'continental-usa-2025' as journey_id,
    TRIM(SUBSTR(
        start_address,
        INSTR(SUBSTR(start_address, 1, LENGTH(start_address) - 20), ',') + 2,
        LENGTH(start_address) - INSTR(SUBSTR(start_address, 1, LENGTH(start_address) - 20), ',') - 22
    )) as state_name,
    TRIM(SUBSTR(
        start_address,
        INSTR(SUBSTR(start_address, 1, LENGTH(start_address) - 20), ',') + 2,
        LENGTH(start_address) - INSTR(SUBSTR(start_address, 1, LENGTH(start_address) - 20), ',') - 22
    )) as state_code,
    DATE(MIN(started_at)) as first_visited_date,
    COUNT(*) as visit_count,
    datetime('now') as created_at
FROM drives
WHERE journey_id = 'continental-usa-2025'
GROUP BY state_name;