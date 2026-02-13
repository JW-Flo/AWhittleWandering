/**
 * REAL TESSIE DATA VALIDATOR & INGESTION
 * 
 * This script validates and ingests ACTUAL Tesla data from Tessie API
 * - Historical data from June 1, 2025 (trip start)
 * - Real-time current vehicle state
 * - Data quality validation and reporting
 * 
 * NO SIMULATIONS - REAL DATA ONLY
 */

import { Env } from '../types/env';
import { getTessieBearerToken } from '../utils/tessieAuth';

// =====================================================
// TESSIE API DATA VALIDATOR
// =====================================================

interface ValidationReport {
  totalDrives: number;
  totalCharges: number;
  dateRange: { start: string; end: string };
  dataGaps: string[];
  qualityIssues: string[];
  statesVisited: string[];
  totalMiles: number;
  totalEnergy: number;
  success: boolean;
}

/**
 * Validate and ingest ALL real Tessie data from trip start
 */
export async function validateAndIngestRealTessieData(env: Env): Promise<ValidationReport> {
  console.log('🚀 STARTING REAL TESSIE DATA VALIDATION & INGESTION');
  console.log('📅 Fetching data from: June 1, 2025 to present');
  
  const report: ValidationReport = {
    totalDrives: 0,
    totalCharges: 0,
    dateRange: { start: '2025-06-01', end: new Date().toISOString().split('T')[0] },
    dataGaps: [],
    qualityIssues: [],
    statesVisited: [],
    totalMiles: 0,
    totalEnergy: 0,
    success: false
  };

  try {
    // Step 1: Validate Tessie API connection
    await validateTessieConnection(env);
    
    // Step 2: Get current vehicle state (real-time)
    const currentState = await fetchRealVehicleState(env);
    await storeVehicleState(env, currentState);
    
    // Step 3: Fetch ALL historical drives from June 1, 2025
    const allDrives = await fetchAllHistoricalDrives(env, '2025-06-01T00:00:00Z');
    report.totalDrives = allDrives.length;
    
    // Step 4: Fetch ALL historical charges from June 1, 2025
    const allCharges = await fetchAllHistoricalCharges(env, '2025-06-01T00:00:00Z');
    report.totalCharges = allCharges.length;
    
    // Step 5: Validate data quality
    const validation = validateDataQuality(allDrives, allCharges);
    report.dataGaps = validation.gaps;
    report.qualityIssues = validation.issues;
    
    // Step 6: Store all real data in D1
    await storeHistoricalDrives(env, allDrives);
    await storeHistoricalCharges(env, allCharges);
    
    // Step 7: Calculate trip statistics
    report.totalMiles = allDrives.reduce((sum, drive) => sum + (drive.distance_miles || 0), 0);
    report.totalEnergy = allCharges.reduce((sum, charge) => sum + (charge.energy_added_kwh || 0), 0);
    report.statesVisited = [...new Set(allDrives.map(d => d.start_state).filter(Boolean))];
    
    // Step 8: Update states visited tracking
    await updateStatesVisitedFromRealData(env, allDrives);
    
    report.success = true;
    
    console.log('✅ REAL TESSIE DATA INGESTION COMPLETE');
    console.log(`📊 ${report.totalDrives} drives, ${report.totalCharges} charges`);
    console.log(`🗺️  ${report.statesVisited.length} states visited`);
    console.log(`🛣️  ${Math.round(report.totalMiles)} total miles`);
    
    return report;
    
  } catch (error: unknown) {
    console.error('❌ REAL DATA INGESTION FAILED:', error);
    const errMsg = error instanceof Error ? error.message : String(error);
    report.qualityIssues.push(`Ingestion failed: ${errMsg}`);
    return report;
  }
}

// =====================================================
// TESSIE API CONNECTION & DATA FETCHING
// =====================================================

async function validateTessieConnection(env: Env): Promise<void> {
  console.log('🔍 Validating Tessie API connection...');
  const token = getTessieBearerToken(env);
  if (!token) throw new Error('Missing Tessie credential: set TESSIE_API_TOKEN');
  
  const response = await fetch('https://api.tessie.com/vehicles', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Tessie API connection failed: ${response.status} - ${response.statusText}`);
  }
  
  const vehicles = await response.json() as unknown[];
  console.log(`✅ Connected to Tessie API - Found ${vehicles.length} vehicle(s)`);
}

async function fetchRealVehicleState(env: Env): Promise<any> {
  console.log('🔴 Fetching REAL-TIME vehicle state from Tessie...');
  const token = getTessieBearerToken(env);
  if (!token) throw new Error('Missing Tessie credential: set TESSIE_API_TOKEN');
  
  const response = await fetch(`https://api.tessie.com/${env.VEHICLE_ID}/state`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch vehicle state: ${response.status}`);
  }
  
  const state = await response.json() as { charge_state?: { battery_level?: number }; drive_state?: { latitude?: number; longitude?: number } };
  console.log(`✅ Current battery: ${state.charge_state?.battery_level}%`);
  console.log(`📍 Current location: ${state.drive_state?.latitude}, ${state.drive_state?.longitude}`);
  
  return state;
}

async function fetchAllHistoricalDrives(env: Env, since: string): Promise<any[]> {
  console.log(`🚗 Fetching ALL historical drives since ${since}...`);
  const token = getTessieBearerToken(env);
  if (!token) throw new Error('Missing Tessie credential: set TESSIE_API_TOKEN');
  
  let allDrives: any[] = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const response = await fetch(`https://api.tessie.com/${env.VEHICLE_ID}/drives?since=${since}&page=${page}&per_page=100`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch drives page ${page}: ${response.status}`);
    }
    
    const data = await response.json() as { results?: unknown[] } | unknown[];
    const drives = (Array.isArray(data) ? data : data.results) || []; // Handle different API response formats
    
    if (drives.length === 0) {
      hasMore = false;
    } else {
      allDrives = allDrives.concat(drives);
      console.log(`📊 Fetched page ${page}: ${drives.length} drives (total: ${allDrives.length})`);
      page++;
      
      // Rate limiting - be nice to Tessie API
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.log(`✅ Total historical drives fetched: ${allDrives.length}`);
  return allDrives;
}

async function fetchAllHistoricalCharges(env: Env, since: string): Promise<any[]> {
  console.log(`🔋 Fetching ALL historical charges since ${since}...`);
  const token = getTessieBearerToken(env);
  if (!token) throw new Error('Missing Tessie credential: set TESSIE_API_TOKEN');
  
  let allCharges: any[] = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const response = await fetch(`https://api.tessie.com/${env.VEHICLE_ID}/charges?since=${since}&page=${page}&per_page=100`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch charges page ${page}: ${response.status}`);
    }
    
    const data = await response.json() as { results?: unknown[] } | unknown[];
    const charges = (Array.isArray(data) ? data : data.results) || []; // Handle different API response formats
    
    if (charges.length === 0) {
      hasMore = false;
    } else {
      allCharges = allCharges.concat(charges);
      console.log(`📊 Fetched page ${page}: ${charges.length} charges (total: ${allCharges.length})`);
      page++;
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.log(`✅ Total historical charges fetched: ${allCharges.length}`);
  return allCharges;
}

// =====================================================
// DATA QUALITY VALIDATION
// =====================================================

function validateDataQuality(drives: any[], charges: any[]): { gaps: string[], issues: string[] } {
  console.log('🔍 Validating real data quality...');
  
  const gaps: string[] = [];
  const issues: string[] = [];
  
  // Check for data gaps in drives
  if (drives.length === 0) {
    gaps.push('No drives found - trip may not have started yet');
  } else {
    const sortedDrives = drives.sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime());
    
    for (let i = 1; i < sortedDrives.length; i++) {
      const prevEnd = new Date(sortedDrives[i-1].ended_at);
      const currStart = new Date(sortedDrives[i].started_at);
      const gapHours = (currStart.getTime() - prevEnd.getTime()) / (1000 * 60 * 60);
      
      if (gapHours > 48) { // Gap longer than 48 hours
        gaps.push(`${gapHours.toFixed(1)}h gap between ${prevEnd.toDateString()} and ${currStart.toDateString()}`);
      }
    }
  }
  
  // Check for data quality issues
  drives.forEach((drive, index) => {
    if (!drive.distance_miles || drive.distance_miles <= 0) {
      issues.push(`Drive ${index + 1}: Missing or invalid distance`);
    }
    if (!drive.started_at || !drive.ended_at) {
      issues.push(`Drive ${index + 1}: Missing timestamps`);
    }
    if (!drive.start_location?.latitude || !drive.start_location?.longitude) {
      issues.push(`Drive ${index + 1}: Missing GPS coordinates`);
    }
  });
  
  charges.forEach((charge, index) => {
    if (!charge.energy_added_kwh || charge.energy_added_kwh <= 0) {
      issues.push(`Charge ${index + 1}: Missing or invalid energy data`);
    }
    if (!charge.started_at) {
      issues.push(`Charge ${index + 1}: Missing start timestamp`);
    }
  });
  
  console.log(`📊 Data validation: ${gaps.length} gaps, ${issues.length} quality issues`);
  return { gaps, issues };
}

// =====================================================
// REAL DATA STORAGE IN D1
// =====================================================

async function storeVehicleState(env: Env, state: any): Promise<void> {
  console.log('💾 Storing real-time vehicle state...');
  
  await env.DB.prepare(`
    INSERT OR REPLACE INTO vehicle_state (
      vehicle_id, battery_level, battery_range, charging_state,
      latitude, longitude, speed, odometer, inside_temp, outside_temp,
      power, locked, climate_on, shift_state, timestamp, state_name, city, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).bind(
    'midnight-shadow',
    state.charge_state?.battery_level || 0,
    state.charge_state?.battery_range || 0,
    state.charge_state?.charging_state || 'Unknown',
    state.drive_state?.latitude || 0,
    state.drive_state?.longitude || 0,
    state.drive_state?.speed || 0,
    state.vehicle_state?.odometer || 0,
    state.climate_state?.inside_temp,
    state.climate_state?.outside_temp,
    state.charge_state?.charger_power || 0,
    state.vehicle_state?.locked || false,
    state.climate_state?.is_climate_on || false,
    state.drive_state?.shift_state,
    new Date().toISOString(),
    null, // We'll get state from coordinates later
    state.drive_state?.city
  ).run();
}

async function storeHistoricalDrives(env: Env, drives: any[]): Promise<void> {
  console.log(`💾 Storing ${drives.length} historical drives...`);
  
  for (const drive of drives) {
    await env.DB.prepare(`
      INSERT OR IGNORE INTO drives (
        tessie_id, vehicle_id, journey_id, started_at, ended_at,
        start_address, end_address, start_latitude, start_longitude,
        end_latitude, end_longitude, distance_miles, duration_minutes,
        energy_used_kwh, average_speed, max_speed, start_battery_level,
        end_battery_level, outside_temp_avg
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      drive.id,
      'midnight-shadow',
      'continental-usa-2025',
      drive.started_at,
      drive.ended_at,
      drive.start_address,
      drive.end_address,
      drive.start_location?.latitude || 0,
      drive.start_location?.longitude || 0,
      drive.end_location?.latitude || 0,
      drive.end_location?.longitude || 0,
      drive.distance_miles || 0,
      drive.duration_minutes || 0,
      drive.energy_used_kwh || 0,
      drive.average_speed || 0,
      drive.max_speed || 0,
      drive.start_battery_level || 0,
      drive.end_battery_level || 0,
      drive.outside_temp_avg
    ).run();
  }
}

async function storeHistoricalCharges(env: Env, charges: any[]): Promise<void> {
  console.log(`💾 Storing ${charges.length} historical charges...`);
  
  for (const charge of charges) {
    await env.DB.prepare(`
      INSERT OR IGNORE INTO charges (
        tessie_id, vehicle_id, journey_id, started_at, ended_at,
        location, latitude, longitude, charger_type, charger_power_kw,
        energy_added_kwh, start_battery_level, end_battery_level,
        cost_usd, duration_minutes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      charge.id,
      'midnight-shadow',
      'continental-usa-2025',
      charge.started_at,
      charge.ended_at,
      charge.location,
      charge.location_data?.latitude || 0,
      charge.location_data?.longitude || 0,
      charge.charger_type || 'Unknown',
      charge.charger_power_kw || 0,
      charge.energy_added_kwh || 0,
      charge.start_battery_level || 0,
      charge.end_battery_level || 0,
      charge.cost_usd || 0,
      charge.duration_minutes || 0
    ).run();
  }
}

async function updateStatesVisitedFromRealData(env: Env, drives: any[]): Promise<void> {
  console.log('🗺️  Updating states visited from real drive data...');
  
  const stateVisits = new Map<string, { miles: number, firstDate: string }>();
  
  drives.forEach(drive => {
    // For now, we'll need to geocode coordinates to states
    // This is a placeholder - you might want to use a geocoding service
    const startState = 'Unknown'; // TODO: Get state from coordinates
    const endState = 'Unknown';   // TODO: Get state from coordinates
    
    if (startState !== 'Unknown') {
      const existing = stateVisits.get(startState) || { miles: 0, firstDate: drive.started_at };
      stateVisits.set(startState, {
        miles: existing.miles + (drive.distance_miles || 0),
        firstDate: existing.firstDate < drive.started_at ? existing.firstDate : drive.started_at
      });
    }
  });
  
  // Store states visited
  for (const [stateName, data] of stateVisits.entries()) {
    await env.DB.prepare(`
      INSERT OR REPLACE INTO states_visited (
        journey_id, state_name, first_visited_date, total_miles_in_state, visit_count
      ) VALUES (?, ?, ?, ?, ?)
    `).bind(
      'continental-usa-2025',
      stateName,
      data.firstDate.split('T')[0],
      data.miles,
      1
    ).run();
  }
}
