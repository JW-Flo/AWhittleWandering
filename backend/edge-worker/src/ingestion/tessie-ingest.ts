/**
 * Tesla Data Ingestion Layer
 * 
 * This module handles ALL data ingestion from Tessie API
 * Components should NEVER call this directly - only the scheduled workers
 * 
 * DATA FLOW:
 * Tessie API → Ingestion Layer → D1 Database → Component APIs → Frontend
 */

import { Env } from '../types/env';

// =====================================================
// SCHEDULED INGESTION WORKERS
// =====================================================

/**
 * Vehicle State Ingestion (Every 5 minutes)
 * Updates real-time vehicle state in D1
 */
export async function ingestVehicleState(env: Env): Promise<void> {
  const startTime = Date.now();
  
  try {
    // Fetch current state from Tessie
    const tessieResponse = await fetch(`https://api.tessie.com/state`, {
      headers: {
        'Authorization': `Bearer ${env.TESSIE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!tessieResponse.ok) {
      throw new Error(`Tessie API error: ${tessieResponse.status}`);
    }

    const stateData = await tessieResponse.json() as any;
    
    // Parse and normalize Tessie data
    const vehicleState = {
      vehicle_id: 'midnight-shadow',
      battery_level: stateData.charge_state?.battery_level || 0,
      battery_range: stateData.charge_state?.battery_range || 0,
      charging_state: stateData.charge_state?.charging_state || 'Unknown',
      latitude: stateData.drive_state?.latitude || 0,
      longitude: stateData.drive_state?.longitude || 0,
      speed: stateData.drive_state?.speed || 0,
      odometer: stateData.vehicle_state?.odometer || 0,
      inside_temp: stateData.climate_state?.inside_temp,
      outside_temp: stateData.climate_state?.outside_temp,
      power: stateData.charge_state?.charger_power || 0,
      locked: stateData.vehicle_state?.locked || false,
      climate_on: stateData.climate_state?.is_climate_on || false,
      shift_state: stateData.drive_state?.shift_state,
      timestamp: new Date().toISOString(),
      state_name: await getStateFromCoordinates(
        stateData.drive_state?.latitude, 
        stateData.drive_state?.longitude
      ),
      city: stateData.drive_state?.city || null
    };

    // Upsert vehicle state (single row per vehicle)
    await env.DB.prepare(`
      INSERT OR REPLACE INTO vehicle_state (
        vehicle_id, battery_level, battery_range, charging_state,
        latitude, longitude, speed, odometer, inside_temp, outside_temp,
        power, locked, climate_on, shift_state, timestamp, state_name, city, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      vehicleState.vehicle_id,
      vehicleState.battery_level,
      vehicleState.battery_range,
      vehicleState.charging_state,
      vehicleState.latitude,
      vehicleState.longitude,
      vehicleState.speed,
      vehicleState.odometer,
      vehicleState.inside_temp,
      vehicleState.outside_temp,
      vehicleState.power,
      vehicleState.locked,
      vehicleState.climate_on,
      vehicleState.shift_state,
      vehicleState.timestamp,
      vehicleState.state_name,
      vehicleState.city
    ).run();

    // Clear component caches that depend on live state
    await clearComponentCaches(env.DB, ['overview']);

    // Log successful ingestion
    await logIngestion(env.DB, 'vehicle_state', 1, true, null, Date.now() - startTime);

  } catch (error: any) {
    console.error('Vehicle state ingestion failed:', error);
    await logIngestion(env.DB, 'vehicle_state', 0, false, error?.message || 'Unknown error', Date.now() - startTime);
    throw error;
  }
}

/**
 * Drives Ingestion (Every 30 minutes)
 * Fetches and stores completed drives from Tessie
 */
export async function ingestDrives(env: Env): Promise<void> {
  const startTime = Date.now();
  
  try {
    // Get last drive timestamp to only fetch new drives
    const lastDrive = await env.DB.prepare(`
      SELECT MAX(started_at) as last_timestamp 
      FROM drives 
      WHERE journey_id = ?
    `).bind('continental-usa-2025').first();

    const since = lastDrive?.last_timestamp || '2025-06-01T00:00:00Z';

    // Fetch drives from Tessie
    const tessieResponse = await fetch(`https://api.tessie.com/drives?since=${since}`, {
      headers: {
        'Authorization': `Bearer ${env.TESSIE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!tessieResponse.ok) {
      throw new Error(`Tessie API error: ${tessieResponse.status}`);
    }

    const drivesData = await tessieResponse.json();
    let processedCount = 0;

    // Process each drive
    for (const drive of drivesData.results || []) {
      // CORRECTED field mapping based on real Tessie API structure
      const driveRecord = {
        tessie_id: drive.id,
        vehicle_id: 'midnight-shadow',
        journey_id: 'continental-usa-2025',
        started_at: new Date(drive.started_at * 1000).toISOString(), // Unix timestamp to ISO
        ended_at: new Date(drive.ended_at * 1000).toISOString(),
        start_address: drive.starting_location,           // CORRECTED: starting_location
        end_address: drive.ending_location,               // CORRECTED: ending_location
        start_latitude: drive.starting_latitude || 0,     // CORRECTED: starting_latitude
        start_longitude: drive.starting_longitude || 0,   // CORRECTED: starting_longitude
        end_latitude: drive.ending_latitude || 0,         // CORRECTED: ending_latitude
        end_longitude: drive.ending_longitude || 0,       // CORRECTED: ending_longitude
        start_state: await getStateFromCoordinates(
          drive.starting_latitude, 
          drive.starting_longitude
        ),
        end_state: await getStateFromCoordinates(
          drive.ending_latitude, 
          drive.ending_longitude
        ),
        distance_miles: drive.odometer_distance || 0,     // CORRECTED: odometer_distance
        duration_minutes: drive.ended_at && drive.started_at ? 
          Math.round((drive.ended_at - drive.started_at) / 60) : 0,
        energy_used_kwh: drive.energy_used || 0,          // CORRECTED: energy_used
        average_speed: drive.average_speed || 0,          // CORRECT
        max_speed: drive.max_speed || 0,                  // CORRECT
        start_battery_level: drive.starting_battery || 0, // CORRECTED: starting_battery
        end_battery_level: drive.ending_battery || 0,     // CORRECTED: ending_battery
        outside_temp_avg: drive.average_outside_temperature, // CORRECTED
        efficiency_miles_per_kwh: 0 // Will be calculated by trigger
      };

      // Insert drive (ignore if already exists)
      await env.DB.prepare(`
        INSERT OR IGNORE INTO drives (
          tessie_id, vehicle_id, journey_id, started_at, ended_at,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_state, end_state,
          distance_miles, duration_minutes, energy_used_kwh,
          average_speed, max_speed, start_battery_level, end_battery_level,
          outside_temp_avg, efficiency_miles_per_kwh
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        driveRecord.tessie_id,
        driveRecord.vehicle_id,
        driveRecord.journey_id,
        driveRecord.started_at,
        driveRecord.ended_at,
        driveRecord.start_address,
        driveRecord.end_address,
        driveRecord.start_latitude,
        driveRecord.start_longitude,
        driveRecord.end_latitude,
        driveRecord.end_longitude,
        driveRecord.start_state,
        driveRecord.end_state,
        driveRecord.distance_miles,
        driveRecord.duration_minutes,
        driveRecord.energy_used_kwh,
        driveRecord.average_speed,
        driveRecord.max_speed,
        driveRecord.start_battery_level,
        driveRecord.end_battery_level,
        driveRecord.outside_temp_avg,
        driveRecord.efficiency_miles_per_kwh
      ).run();

      // Update states visited
      if (driveRecord.start_state) {
        await updateStateVisited(env.DB, 'continental-usa-2025', driveRecord.start_state, driveRecord.distance_miles);
      }
      if (driveRecord.end_state && driveRecord.end_state !== driveRecord.start_state) {
        await updateStateVisited(env.DB, 'continental-usa-2025', driveRecord.end_state, 0);
      }

      processedCount++;
    }

    // Clear component caches
    await clearComponentCaches(env.DB, ['overview', 'timeline', 'map', 'stats']);

    // Log successful ingestion
    await logIngestion(env.DB, 'drives', processedCount, true, null, Date.now() - startTime);

  } catch (error) {
    console.error('Drives ingestion failed:', error);
    await logIngestion(env.DB, 'drives', 0, false, error.message, Date.now() - startTime);
    throw error;
  }
}

/**
 * Charges Ingestion (Every 30 minutes)
 * Fetches and stores charging sessions from Tessie
 */
export async function ingestCharges(env: Env): Promise<void> {
  const startTime = Date.now();
  
  try {
    // Get last charge timestamp
    const lastCharge = await env.DB.prepare(`
      SELECT MAX(started_at) as last_timestamp 
      FROM charges 
      WHERE journey_id = ?
    `).bind('continental-usa-2025').first();

    const since = lastCharge?.last_timestamp || '2025-06-01T00:00:00Z';

    // Fetch charges from Tessie
    const tessieResponse = await fetch(`https://api.tessie.com/charges?since=${since}`, {
      headers: {
        'Authorization': `Bearer ${env.TESSIE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!tessieResponse.ok) {
      throw new Error(`Tessie API error: ${tessieResponse.status}`);
    }

    const chargesData = await tessieResponse.json();
    let processedCount = 0;

    // Process each charge
    for (const charge of chargesData.results || []) {
      // CORRECTED field mapping for charges based on real Tessie API structure
      const chargeRecord = {
        tessie_id: charge.id,
        vehicle_id: 'midnight-shadow',
        journey_id: 'continental-usa-2025',
        started_at: new Date(charge.started_at * 1000).toISOString(), // Unix timestamp to ISO
        ended_at: charge.ended_at ? new Date(charge.ended_at * 1000).toISOString() : null,
        location: charge.location,
        latitude: charge.latitude || 0,
        longitude: charge.longitude || 0,
        state_name: await getStateFromCoordinates(
          charge.latitude, 
          charge.longitude
        ),
        charger_type: charge.is_supercharger ? 'Supercharger' : 
                     (charge.is_fast_charger ? 'Fast Charger' : 'Level 2'), // CORRECTED
        charger_power_kw: 0, // Not provided in API
        energy_added_kwh: charge.energy_added || 0,        // CORRECTED: energy_added
        start_battery_level: charge.starting_battery || 0, // CORRECTED: starting_battery
        end_battery_level: charge.ending_battery || 0,     // CORRECTED: ending_battery
        cost_usd: charge.cost || 0,                        // CORRECTED: cost
        duration_minutes: charge.ended_at && charge.started_at ? 
          Math.round((charge.ended_at - charge.started_at) / 60) : 0
      };

      // Insert charge (ignore if already exists)
      await env.DB.prepare(`
        INSERT OR IGNORE INTO charges (
          tessie_id, vehicle_id, journey_id, started_at, ended_at,
          location, latitude, longitude, state_name, charger_type,
          charger_power_kw, energy_added_kwh, start_battery_level,
          end_battery_level, cost_usd, duration_minutes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        chargeRecord.tessie_id,
        chargeRecord.vehicle_id,
        chargeRecord.journey_id,
        chargeRecord.started_at,
        chargeRecord.ended_at,
        chargeRecord.location,
        chargeRecord.latitude,
        chargeRecord.longitude,
        chargeRecord.state_name,
        chargeRecord.charger_type,
        chargeRecord.charger_power_kw,
        chargeRecord.energy_added_kwh,
        chargeRecord.start_battery_level,
        chargeRecord.end_battery_level,
        chargeRecord.cost_usd,
        chargeRecord.duration_minutes
      ).run();

      processedCount++;
    }

    // Clear component caches
    await clearComponentCaches(env.DB, ['overview', 'timeline', 'stats']);

    // Log successful ingestion
    await logIngestion(env.DB, 'charges', processedCount, true, null, Date.now() - startTime);

  } catch (error) {
    console.error('Charges ingestion failed:', error);
    await logIngestion(env.DB, 'charges', 0, false, error.message, Date.now() - startTime);
    throw error;
  }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

async function getStateFromCoordinates(lat: number, lng: number): Promise<string | null> {
  if (!lat || !lng) return null;
  
  // Simple state lookup - you may want to use a reverse geocoding service
  // For now, return null and let the frontend handle state detection
  return null;
}

async function updateStateVisited(
  db: D1Database, 
  journeyId: string, 
  stateName: string, 
  additionalMiles: number
): Promise<void> {
  await db.prepare(`
    INSERT INTO states_visited (journey_id, state_name, first_visited_date, visit_count, total_miles_in_state)
    VALUES (?, ?, date('now'), 1, ?)
    ON CONFLICT(journey_id, state_name) DO UPDATE SET
      visit_count = visit_count + 1,
      total_miles_in_state = total_miles_in_state + ?,
      updated_at = datetime('now')
  `).bind(journeyId, stateName, additionalMiles, additionalMiles).run();
}

async function clearComponentCaches(db: D1Database, components: string[]): Promise<void> {
  if (components.length === 0) return;
  
  const placeholders = components.map(() => '?').join(',');
  await db.prepare(`
    DELETE FROM component_cache 
    WHERE component_name IN (${placeholders})
  `).bind(...components).run();
}

async function logIngestion(
  db: D1Database,
  operation: string,
  recordsProcessed: number,
  success: boolean,
  errors: string | null,
  durationMs: number
): Promise<void> {
  await db.prepare(`
    INSERT INTO ingestion_logs 
    (operation, records_processed, success, errors, duration_ms)
    VALUES (?, ?, ?, ?, ?)
  `).bind(operation, recordsProcessed, success, errors, durationMs).run();
}
