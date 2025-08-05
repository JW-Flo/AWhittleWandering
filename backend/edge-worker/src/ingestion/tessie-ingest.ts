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
  
  // Comprehensive US state boundaries for accurate detection
  const US_STATES = [
    // Southeast (where recent drives are happening)
    { name: 'North Carolina', minLat: 33.7514, maxLat: 36.5881, minLng: -84.3219, maxLng: -75.3603 },
    { name: 'South Carolina', minLat: 32.0346, maxLat: 35.2155, minLng: -83.3532, maxLng: -78.5408 },
    { name: 'Virginia', minLat: 36.5407, maxLat: 39.4660, minLng: -83.6754, maxLng: -75.1663 },
    { name: 'Georgia', minLat: 30.3552, maxLat: 35.0008, minLng: -85.6051, maxLng: -80.7514 },
    { name: 'Tennessee', minLat: 34.9829, maxLat: 36.6781, minLng: -90.3103, maxLng: -81.6469 },
    { name: 'Kentucky', minLat: 36.4970, maxLat: 39.1472, minLng: -89.5715, maxLng: -81.9645 },
    
    // Northeast
    { name: 'Connecticut', minLat: 40.9959, maxLat: 42.0508, minLng: -73.7277, maxLng: -71.7869 },
    { name: 'Maine', minLat: 42.9633, maxLat: 47.4596, minLng: -71.0826, maxLng: -66.8847 },
    { name: 'Massachusetts', minLat: 41.2376, maxLat: 42.8868, minLng: -73.5081, maxLng: -69.9286 },
    { name: 'New Hampshire', minLat: 42.6970, maxLat: 45.3058, minLng: -72.5570, maxLng: -70.6104 },
    { name: 'New Jersey', minLat: 38.9281, maxLat: 41.3574, minLng: -75.5597, maxLng: -73.8937 },
    { name: 'New York', minLat: 40.4774, maxLat: 45.0158, minLng: -79.7624, maxLng: -71.7774 },
    { name: 'Pennsylvania', minLat: 39.7198, maxLat: 42.2694, minLng: -80.5194, maxLng: -74.6895 },
    { name: 'Rhode Island', minLat: 41.1460, maxLat: 42.0187, minLng: -71.8620, maxLng: -71.1208 },
    { name: 'Vermont', minLat: 42.7269, maxLat: 45.0167, minLng: -73.4370, maxLng: -71.4653 },
    
    // Southwest  
    { name: 'Texas', minLat: 25.8371, maxLat: 36.5007, minLng: -106.6456, maxLng: -93.5083 },
    { name: 'New Mexico', minLat: 31.3323, maxLat: 37.0000, minLng: -109.0501, maxLng: -103.0020 },
    { name: 'Arizona', minLat: 31.3322, maxLat: 37.0042, minLng: -114.8165, maxLng: -109.0452 },
    { name: 'Utah', minLat: 36.9979, maxLat: 42.0013, minLng: -114.0524, maxLng: -109.0414 },
    { name: 'Nevada', minLat: 35.0018, maxLat: 42.0020, minLng: -120.0064, maxLng: -114.0396 },
    { name: 'California', minLat: 32.5343, maxLat: 42.0095, minLng: -124.4820, maxLng: -114.1312 },
    { name: 'Colorado', minLat: 36.9924, maxLat: 41.0032, minLng: -109.0603, maxLng: -102.0424 },
    
    // West
    { name: 'Oregon', minLat: 41.9918, maxLat: 46.2991, minLng: -124.7034, maxLng: -116.4635 },
    { name: 'Washington', minLat: 45.5435, maxLat: 49.0025, minLng: -124.8489, maxLng: -116.9155 },
    { name: 'Idaho', minLat: 41.9880, maxLat: 49.0011, minLng: -117.2434, maxLng: -111.0435 },
    { name: 'Montana', minLat: 44.3584, maxLat: 49.0011, minLng: -116.0489, maxLng: -104.0395 },
    { name: 'Wyoming', minLat: 40.9979, maxLat: 45.0058, minLng: -111.0570, maxLng: -104.0205 },
    
    // Midwest
    { name: 'Illinois', minLat: 36.9540, maxLat: 42.5083, minLng: -91.5130, maxLng: -87.0199 },
    { name: 'Indiana', minLat: 37.7554, maxLat: 41.7606, minLng: -88.0978, maxLng: -84.7845 },
    { name: 'Iowa', minLat: 40.3755, maxLat: 43.5012, minLng: -96.6397, maxLng: -90.1401 },
    { name: 'Kansas', minLat: 36.9930, maxLat: 40.0031, minLng: -102.0517, maxLng: -94.5882 },
    { name: 'Michigan', minLat: 41.6960, maxLat: 48.3060, minLng: -90.4186, maxLng: -82.1220 },
    { name: 'Minnesota', minLat: 43.4999, maxLat: 49.3841, minLng: -97.2394, maxLng: -89.4835 },
    { name: 'Missouri', minLat: 35.9957, maxLat: 40.6136, minLng: -95.7742, maxLng: -89.0989 },
    { name: 'Nebraska', minLat: 39.9999, maxLat: 43.0017, minLng: -104.0531, maxLng: -95.3080 },
    { name: 'North Dakota', minLat: 45.9350, maxLat: 49.0008, minLng: -104.0489, maxLng: -96.5544 },
    { name: 'Ohio', minLat: 38.4030, maxLat: 41.9773, minLng: -84.8203, maxLng: -80.5180 },
    { name: 'South Dakota', minLat: 42.4799, maxLat: 45.9454, minLng: -104.0579, maxLng: -96.4364 },
    { name: 'Wisconsin', minLat: 42.4919, maxLat: 47.3085, minLng: -92.8894, maxLng: -86.2490 },
    
    // Additional southeastern states
    { name: 'Florida', minLat: 24.3963, maxLat: 31.0014, minLng: -87.6349, maxLng: -79.9743 },
    { name: 'Alabama', minLat: 30.2307, maxLat: 35.0080, minLng: -88.4734, maxLng: -84.8890 },
    { name: 'Mississippi', minLat: 30.1734, maxLat: 35.0041, minLng: -91.6554, maxLng: -88.0977 },
    { name: 'Louisiana', minLat: 28.9259, maxLat: 33.0197, minLng: -94.0431, maxLng: -88.8177 },
    { name: 'Arkansas', minLat: 33.0041, maxLat: 36.4996, minLng: -94.6178, maxLng: -89.6439 },
    { name: 'Oklahoma', minLat: 33.6160, maxLat: 37.0020, minLng: -103.0025, maxLng: -94.4312 },
    
    // Mid-Atlantic
    { name: 'Delaware', minLat: 38.4513, maxLat: 39.8390, minLng: -75.7887, maxLng: -74.9848 },
    { name: 'Maryland', minLat: 37.9113, maxLat: 39.7231, minLng: -79.4877, maxLng: -75.0490 },
    { name: 'West Virginia', minLat: 37.2014, maxLat: 40.6381, minLng: -82.6447, maxLng: -77.7190 },
    { name: 'District of Columbia', minLat: 38.7916, maxLat: 38.9958, minLng: -77.1195, maxLng: -76.9093 }
  ];

  // Find matching state
  for (const state of US_STATES) {
    if (lat >= state.minLat && lat <= state.maxLat && 
        lng >= state.minLng && lng <= state.maxLng) {
      return state.name;
    }
  }

  return null; // Unknown location
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
