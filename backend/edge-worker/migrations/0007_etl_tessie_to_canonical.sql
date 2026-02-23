-- Migration: ETL raw import tables into canonical trip tables
-- Date: 2026-01-30
-- Purpose: Idempotently project drive_segments + energy_events into drives/charges,
--          then recompute journey-level aggregates.

PRAGMA foreign_keys = ON;

-- Insert canonical drives from imported drive segments.
-- Deterministic key: tessie_id = -drive_segments.id
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
  rated_range_used,
  outside_temp_avg,
  average_inside_temp,
  efficiency_miles_per_kwh
)
SELECT
  -ds.id,
  ds.vehicle_id,
  ds.journey_id,
  ds.start_time,
  ds.end_time,
  ds.start_address,
  ds.end_address,
  ds.start_latitude,
  ds.start_longitude,
  ds.end_latitude,
  ds.end_longitude,
  NULLIF(TRIM(ds.start_state), ''),
  NULLIF(TRIM(ds.end_state), ''),
  COALESCE(ds.distance_miles, 0),
  COALESCE(ds.duration_minutes, 0),
  COALESCE(ds.energy_used_kwh, 0),
  COALESCE(ds.avg_speed_mph, 0),
  COALESCE(ds.max_speed_mph, 0),
  COALESCE(ds.start_battery_level, 0),
  COALESCE(ds.end_battery_level, 0),
  COALESCE(ds.rated_range_used, 0),
  ds.avg_outside_temp_f,
  ds.avg_inside_temp_f,
  COALESCE(ds.efficiency_miles_per_kwh, 0)
FROM drive_segments ds;

-- Insert canonical charges from imported energy events.
-- Deterministic key: tessie_id = -energy_events.id
INSERT OR IGNORE INTO charges (
  tessie_id,
  vehicle_id,
  journey_id,
  started_at,
  ended_at,
  location,
  latitude,
  longitude,
  state_name,
  city,
  charger_type,
  charger_power_kw,
  energy_added_kwh,
  energy_used_kwh,
  charge_rate_avg,
  charge_rate_max,
  start_battery_level,
  end_battery_level,
  start_range,
  end_range,
  miles_added,
  miles_added_ideal,
  cost_usd,
  cost_per_kwh,
  duration_minutes,
  is_supercharger,
  charging_network
)
SELECT
  -ee.id,
  ee.vehicle_id,
  ee.journey_id,
  ee.start_time,
  ee.end_time,
  ee.location_name,
  ee.latitude,
  ee.longitude,
  NULLIF(TRIM(ee.state_name), ''),
  ee.city,
  ee.charger_type,
  COALESCE(ee.charger_power_kw, 0),
  COALESCE(ee.energy_added_kwh, 0),
  COALESCE(ee.energy_used_kwh, 0),
  COALESCE(ee.avg_charge_rate_kw, 0),
  COALESCE(ee.peak_charge_rate_kw, 0),
  COALESCE(ee.start_battery_level, 0),
  COALESCE(ee.end_battery_level, 0),
  COALESCE(ee.start_range_miles, 0),
  COALESCE(ee.end_range_miles, 0),
  COALESCE(ee.miles_added, 0),
  COALESCE(ee.miles_added_rated, 0),
  COALESCE(ee.cost_usd, 0),
  COALESCE(ee.cost_per_kwh, 0),
  COALESCE(ee.duration_minutes, 0),
  COALESCE(ee.is_supercharger, 0),
  ee.charging_network
FROM energy_events ee
WHERE LOWER(COALESCE(ee.event_type, 'charge')) = 'charge';

-- Rebuild per-journey state aggregates for imported journeys only.
DELETE FROM states_visited
WHERE journey_id IN (
  SELECT DISTINCT journey_id FROM drive_segments
  UNION
  SELECT DISTINCT journey_id FROM energy_events
);

INSERT INTO states_visited (
  journey_id,
  state_name,
  first_visited_date,
  first_drive_id,
  visit_count,
  total_miles_in_state,
  total_time_minutes,
  entry_latitude,
  entry_longitude,
  entry_address,
  is_current_state,
  last_updated
)
WITH affected_journeys AS (
  SELECT DISTINCT journey_id FROM drive_segments
  UNION
  SELECT DISTINCT journey_id FROM energy_events
),
state_events AS (
  SELECT
    d.journey_id,
    NULLIF(TRIM(d.start_state), '') AS state_name,
    d.started_at AS event_time,
    d.id AS drive_id,
    d.start_latitude AS latitude,
    d.start_longitude AS longitude,
    d.start_address AS entry_address,
    CASE
      WHEN NULLIF(TRIM(d.end_state), '') = NULLIF(TRIM(d.start_state), '') THEN COALESCE(d.distance_miles, 0)
      ELSE COALESCE(d.distance_miles, 0) / 2.0
    END AS miles_delta,
    CASE
      WHEN NULLIF(TRIM(d.end_state), '') = NULLIF(TRIM(d.start_state), '') THEN COALESCE(d.duration_minutes, 0)
      ELSE COALESCE(d.duration_minutes, 0) / 2
    END AS minutes_delta
  FROM drives d
  INNER JOIN affected_journeys aj ON aj.journey_id = d.journey_id
  WHERE NULLIF(TRIM(d.start_state), '') IS NOT NULL

  UNION ALL

  SELECT
    d.journey_id,
    NULLIF(TRIM(d.end_state), '') AS state_name,
    d.ended_at AS event_time,
    d.id AS drive_id,
    d.end_latitude AS latitude,
    d.end_longitude AS longitude,
    d.end_address AS entry_address,
    COALESCE(d.distance_miles, 0) / 2.0 AS miles_delta,
    COALESCE(d.duration_minutes, 0) / 2 AS minutes_delta
  FROM drives d
  INNER JOIN affected_journeys aj ON aj.journey_id = d.journey_id
  WHERE NULLIF(TRIM(d.end_state), '') IS NOT NULL
    AND NULLIF(TRIM(d.end_state), '') != NULLIF(TRIM(d.start_state), '')

  UNION ALL

  SELECT
    c.journey_id,
    NULLIF(TRIM(c.state_name), '') AS state_name,
    c.started_at AS event_time,
    NULL AS drive_id,
    c.latitude,
    c.longitude,
    c.location,
    0.0 AS miles_delta,
    0 AS minutes_delta
  FROM charges c
  INNER JOIN affected_journeys aj ON aj.journey_id = c.journey_id
  WHERE NULLIF(TRIM(c.state_name), '') IS NOT NULL
),
ranked_events AS (
  SELECT
    se.*,
    ROW_NUMBER() OVER (
      PARTITION BY se.journey_id, se.state_name
      ORDER BY se.event_time ASC, COALESCE(se.drive_id, 0) ASC
    ) AS first_rank,
    ROW_NUMBER() OVER (
      PARTITION BY se.journey_id
      ORDER BY se.event_time DESC, COALESCE(se.drive_id, 0) DESC
    ) AS current_rank
  FROM state_events se
),
state_rollup AS (
  SELECT
    journey_id,
    state_name,
    COUNT(*) AS visit_count,
    SUM(miles_delta) AS total_miles_in_state,
    SUM(minutes_delta) AS total_time_minutes
  FROM state_events
  GROUP BY journey_id, state_name
)
SELECT
  sr.journey_id,
  sr.state_name,
  DATE(re.event_time) AS first_visited_date,
  re.drive_id AS first_drive_id,
  sr.visit_count,
  sr.total_miles_in_state,
  sr.total_time_minutes,
  re.latitude AS entry_latitude,
  re.longitude AS entry_longitude,
  re.entry_address,
  CASE WHEN re.current_rank = 1 THEN 1 ELSE 0 END AS is_current_state,
  CURRENT_TIMESTAMP
FROM state_rollup sr
INNER JOIN ranked_events re
  ON re.journey_id = sr.journey_id
 AND re.state_name = sr.state_name
 AND re.first_rank = 1;

-- Refresh journey aggregate metrics for imported journeys only.
UPDATE journeys
SET
  total_miles = COALESCE((
    SELECT SUM(COALESCE(d.distance_miles, 0))
    FROM drives d
    WHERE d.journey_id = journeys.id
  ), 0),
  total_drives = COALESCE((
    SELECT COUNT(*)
    FROM drives d
    WHERE d.journey_id = journeys.id
  ), 0),
  total_charges = COALESCE((
    SELECT COUNT(*)
    FROM charges c
    WHERE c.journey_id = journeys.id
  ), 0),
  total_energy_used_kwh = COALESCE((
    SELECT SUM(COALESCE(d.energy_used_kwh, 0))
    FROM drives d
    WHERE d.journey_id = journeys.id
  ), 0) + COALESCE((
    SELECT SUM(COALESCE(c.energy_used_kwh, 0))
    FROM charges c
    WHERE c.journey_id = journeys.id
  ), 0),
  total_cost_usd = COALESCE((
    SELECT SUM(COALESCE(c.cost_usd, 0))
    FROM charges c
    WHERE c.journey_id = journeys.id
  ), 0),
  total_states = COALESCE((
    SELECT COUNT(*)
    FROM states_visited s
    WHERE s.journey_id = journeys.id
  ), 0),
  overall_efficiency_miles_per_kwh = CASE
    WHEN (
      COALESCE((
        SELECT SUM(COALESCE(d.energy_used_kwh, 0))
        FROM drives d
        WHERE d.journey_id = journeys.id
      ), 0) + COALESCE((
        SELECT SUM(COALESCE(c.energy_used_kwh, 0))
        FROM charges c
        WHERE c.journey_id = journeys.id
      ), 0)
    ) > 0
      THEN COALESCE((
        SELECT SUM(COALESCE(d.distance_miles, 0))
        FROM drives d
        WHERE d.journey_id = journeys.id
      ), 0) / (
        COALESCE((
          SELECT SUM(COALESCE(d.energy_used_kwh, 0))
          FROM drives d
          WHERE d.journey_id = journeys.id
        ), 0) + COALESCE((
          SELECT SUM(COALESCE(c.energy_used_kwh, 0))
          FROM charges c
          WHERE c.journey_id = journeys.id
        ), 0)
      )
    ELSE 0
  END,
  updated_at = CURRENT_TIMESTAMP
WHERE journeys.id IN (
  SELECT DISTINCT journey_id FROM drive_segments
  UNION
  SELECT DISTINCT journey_id FROM energy_events
);
