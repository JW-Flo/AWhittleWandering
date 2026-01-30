/**
 * Tesla Journey Tracker - Component-Optimized API Architecture
 * 
 * ARCHITECTURE PRINCIPLES:
 * 1. Components only call READ APIs - never direct Tessie integration
 * 2. Aggressive caching for component performance
 * 3. Clear separation: Ingestion → Business Logic → Component APIs
 * 4. Single D1 database with component-optimized queries
 */

import { Env, D1Database } from '../types/env';

// =====================================================
// DATABASE ROW TYPES
// =====================================================

interface OverviewDataRow {
  name: string;
  start_date: string;
  status: string;
  days_elapsed: number;
  battery_level: number;
  battery_range: number;
  charging_state: string;
  current_city: string;
  current_state: string;
  last_update: string;
  states_visited: number;
  total_miles: number;
  total_drives: number;
  total_charges: number;
  total_cost: number;
}

interface StatsDataRow {
  total_drives: number;
  total_miles: number;
  avg_efficiency: number;
  max_speed: number;
  avg_drive_duration: number;
  total_charges: number;
  total_energy_added: number;
  total_cost: number;
  avg_charge_duration: number;
  states_visited: number;
}

interface VehicleStateRow {
  battery_level: number;
  battery_range: number;
  charging_state: string;
  latitude: number;
  longitude: number;
  city: string;
  state_name: string;
  speed: number;
  odometer: number;
  shift_state: string;
  inside_temp: number;
  outside_temp: number;
  climate_on: boolean;
  locked: boolean;
  timestamp: string;
  updated_at: string;
}

interface CacheRow {
  cache_data: string;
}

// =====================================================
// COMPONENT READ APIs (Frontend calls these)
// =====================================================

/**
 * Overview Component API
 * GET /api/overview
 * Returns dashboard summary data with caching
 */
export async function getOverviewData(env: Env): Promise<OverviewResponse> {
  const cacheKey = 'overview:dashboard';
  
  // Check cache first (5 minute TTL)
  const cached = await getCachedResponse(env.DB, cacheKey, 5);
  if (cached) return JSON.parse(cached);

  // Query optimized view
  const result = await env.DB.prepare(`
    SELECT * FROM overview_data 
    WHERE journey_id = ?
  `).bind('continental-usa-2025').first<OverviewDataRow>();

  if (!result) {
    throw new Error('Overview data not found');
  }

  const response: OverviewResponse = {
    journey: {
      name: result.name,
      startDate: result.start_date,
      status: result.status,
      daysElapsed: Math.floor(result.days_elapsed)
    },
    currentState: {
      batteryLevel: result.battery_level,
      batteryRange: result.battery_range,
      chargingState: result.charging_state,
      location: `${result.current_city}, ${result.current_state}`,
      lastUpdate: result.last_update
    },
    progress: {
      statesVisited: result.states_visited,
      totalMiles: Math.round(result.total_miles),
      totalDrives: result.total_drives,
      totalCharges: result.total_charges,
      totalCost: Math.round(result.total_cost * 100) / 100
    }
  };

  // Cache for 5 minutes
  await setCacheResponse(env.DB, cacheKey, JSON.stringify(response), 5);
  return response;
}

/**
 * Timeline Component API
 * GET /api/timeline?limit=50&offset=0
 * Returns paginated timeline events with caching
 */
export async function getTimelineData(
  env: Env, 
  limit: number = 50, 
  offset: number = 0
): Promise<TimelineResponse> {
  const cacheKey = `timeline:${limit}:${offset}`;
  
  // Check cache (2 minute TTL for timeline)
  const cached = await getCachedResponse(env.DB, cacheKey, 2);
  if (cached) return JSON.parse(cached);

  // Query timeline view with pagination
  const events = await env.DB.prepare(`
    SELECT * FROM timeline_data 
    LIMIT ? OFFSET ?
  `).bind(limit, offset).all();

  const response: TimelineResponse = {
    events: events.results.map((row: any) => ({
      type: row.event_type,
      id: row.id,
      timestamp: row.timestamp,
      location: row.location,
      destination: row.destination,
      primaryMetric: row.primary_metric,
      metricUnit: row.metric_unit,
      coordinates: {
        lat: row.latitude,
        lng: row.longitude
      },
      state: row.state_name,
      details: JSON.parse(row.details)
    })),
    pagination: {
      limit,
      offset,
      hasMore: events.results.length === limit
    }
  };

  // Cache for 2 minutes
  await setCacheResponse(env.DB, cacheKey, JSON.stringify(response), 2);
  return response;
}

/**
 * Map Component API
 * GET /api/map/routes
 * Returns optimized route data for map visualization
 */
export async function getMapRoutes(env: Env): Promise<MapRoutesResponse> {
  const cacheKey = 'map:routes';
  
  // Check cache (10 minute TTL for map data)
  const cached = await getCachedResponse(env.DB, cacheKey, 10);
  if (cached) return JSON.parse(cached);

  // Get drive routes (simplified for performance)
  const drives = await env.DB.prepare(`
    SELECT 
      id,
      start_latitude as start_lat,
      start_longitude as start_lng,
      end_latitude as end_lat,
      end_longitude as end_lng,
      started_at,
      distance_miles,
      start_address,
      end_address,
      start_state,
      end_state
    FROM drives 
    WHERE journey_id = ?
    ORDER BY started_at
  `).bind('continental-usa-2025').all();

  // Get charge locations
  const charges = await env.DB.prepare(`
    SELECT 
      id,
      latitude as lat,
      longitude as lng,
      location,
      charger_type,
      energy_added_kwh,
      started_at,
      state_name
    FROM charges 
    WHERE journey_id = ?
    ORDER BY started_at
  `).bind('continental-usa-2025').all();

  const response: MapRoutesResponse = {
    routes: drives.results.map((drive: any) => ({
      id: drive.id,
      start: { lat: drive.start_lat, lng: drive.start_lng },
      end: { lat: drive.end_lat, lng: drive.end_lng },
      distance: drive.distance_miles,
      timestamp: drive.started_at,
      startLocation: drive.start_address,
      endLocation: drive.end_address,
      states: [drive.start_state, drive.end_state].filter(Boolean)
    })),
    chargers: charges.results.map((charge: any) => ({
      id: charge.id,
      position: { lat: charge.lat, lng: charge.lng },
      name: charge.location,
      type: charge.charger_type,
      energyAdded: charge.energy_added_kwh,
      timestamp: charge.started_at,
      state: charge.state_name
    }))
  };

  // Cache for 10 minutes
  await setCacheResponse(env.DB, cacheKey, JSON.stringify(response), 10);
  return response;
}

/**
 * Stats Component API
 * GET /api/stats/summary
 * Returns aggregated statistics with heavy caching
 */
export async function getStatsData(env: Env): Promise<StatsResponse> {
  const cacheKey = 'stats:summary';
  
  // Check cache (15 minute TTL for stats)
  const cached = await getCachedResponse(env.DB, cacheKey, 15);
  if (cached) return JSON.parse(cached);

  // Complex aggregation query
  const stats = await env.DB.prepare(`
    SELECT 
      -- Driving stats
      COUNT(DISTINCT d.id) as total_drives,
      COALESCE(SUM(d.distance_miles), 0) as total_miles,
      COALESCE(AVG(d.efficiency_miles_per_kwh), 0) as avg_efficiency,
      COALESCE(MAX(d.max_speed), 0) as max_speed,
      COALESCE(AVG(d.duration_minutes), 0) as avg_drive_duration,
      
      -- Charging stats
      COUNT(DISTINCT c.id) as total_charges,
      COALESCE(SUM(c.energy_added_kwh), 0) as total_energy_added,
      COALESCE(SUM(c.cost_usd), 0) as total_cost,
      COALESCE(AVG(c.duration_minutes), 0) as avg_charge_duration,
      
      -- State coverage
      COUNT(DISTINCT sv.state_name) as states_visited
      
    FROM journeys j
    LEFT JOIN drives d ON d.journey_id = j.id
    LEFT JOIN charges c ON c.journey_id = j.id  
    LEFT JOIN states_visited sv ON sv.journey_id = j.id
    WHERE j.id = ?
  `).bind('continental-usa-2025').first<StatsDataRow>();

  if (!stats) {
    throw new Error('Stats data not found');
  }

  const response: StatsResponse = {
    driving: {
      totalMiles: Math.round(stats.total_miles),
      totalDrives: stats.total_drives,
      avgEfficiency: Math.round(stats.avg_efficiency * 100) / 100,
      maxSpeed: Math.round(stats.max_speed),
      avgDriveDuration: Math.round(stats.avg_drive_duration)
    },
    charging: {
      totalCharges: stats.total_charges,
      totalEnergyAdded: Math.round(stats.total_energy_added * 100) / 100,
      totalCost: Math.round(stats.total_cost * 100) / 100,
      avgChargeDuration: Math.round(stats.avg_charge_duration)
    },
    progress: {
      statesVisited: stats.states_visited,
      percentageComplete: Math.round((stats.states_visited / 48) * 100) // Continental US states
    }
  };

  // Cache for 15 minutes
  await setCacheResponse(env.DB, cacheKey, JSON.stringify(response), 15);
  return response;
}

// =====================================================
// LIVE VEHICLE STATE API (Real-time, no cache)
// =====================================================

/**
 * Live Vehicle State API
 * GET /api/vehicle/live
 * Returns current vehicle state (no caching for real-time data)
 */
export async function getLiveVehicleState(env: Env): Promise<VehicleStateResponse> {
  const state = await env.DB.prepare(`
    SELECT * FROM vehicle_state 
    WHERE vehicle_id = ?
  `).bind('midnight-shadow').first<VehicleStateRow>();

  if (!state) {
    throw new Error('Vehicle state not found');
  }

  return {
    batteryLevel: state.battery_level,
    batteryRange: state.battery_range,
    chargingState: state.charging_state,
    location: {
      lat: state.latitude,
      lng: state.longitude,
      city: state.city,
      state: state.state_name
    },
    driving: {
      speed: state.speed,
      odometer: state.odometer,
      shiftState: state.shift_state
    },
    climate: {
      insideTemp: state.inside_temp,
      outsideTemp: state.outside_temp,
      climateOn: state.climate_on
    },
    security: {
      locked: state.locked
    },
    timestamp: state.timestamp,
    lastUpdate: state.updated_at
  };
}

// =====================================================
// CACHING UTILITIES
// =====================================================

async function getCachedResponse(
  db: D1Database, 
  cacheKey: string, 
  _maxAgeMinutes: number
): Promise<string | null> {
  const cached = await db.prepare(`
    SELECT cache_data FROM component_cache 
    WHERE cache_key = ? AND expires_at > datetime('now')
  `).bind(cacheKey).first<CacheRow>();

  return cached?.cache_data ?? null;
}

async function setCacheResponse(
  db: D1Database, 
  cacheKey: string, 
  data: string, 
  ttlMinutes: number
): Promise<void> {
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();
  
  await db.prepare(`
    INSERT OR REPLACE INTO component_cache 
    (cache_key, component_name, cache_data, expires_at, journey_id, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `).bind(
    cacheKey,
    cacheKey.split(':')[0], // Extract component name from cache key
    data,
    expiresAt,
    'continental-usa-2025'
  ).run();
}

// =====================================================
// TYPE DEFINITIONS
// =====================================================

interface OverviewResponse {
  journey: {
    name: string;
    startDate: string;
    status: string;
    daysElapsed: number;
  };
  currentState: {
    batteryLevel: number;
    batteryRange: number;
    chargingState: string;
    location: string;
    lastUpdate: string;
  };
  progress: {
    statesVisited: number;
    totalMiles: number;
    totalDrives: number;
    totalCharges: number;
    totalCost: number;
  };
}

interface TimelineResponse {
  events: Array<{
    type: 'drive' | 'charge';
    id: number;
    timestamp: string;
    location: string;
    destination: string | null;
    primaryMetric: number;
    metricUnit: string;
    coordinates: { lat: number; lng: number };
    state: string;
    details: Record<string, any>;
  }>;
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

interface MapRoutesResponse {
  routes: Array<{
    id: number;
    start: { lat: number; lng: number };
    end: { lat: number; lng: number };
    distance: number;
    timestamp: string;
    startLocation: string;
    endLocation: string;
    states: string[];
  }>;
  chargers: Array<{
    id: number;
    position: { lat: number; lng: number };
    name: string;
    type: string;
    energyAdded: number;
    timestamp: string;
    state: string;
  }>;
}

interface StatsResponse {
  driving: {
    totalMiles: number;
    totalDrives: number;
    avgEfficiency: number;
    maxSpeed: number;
    avgDriveDuration: number;
  };
  charging: {
    totalCharges: number;
    totalEnergyAdded: number;
    totalCost: number;
    avgChargeDuration: number;
  };
  progress: {
    statesVisited: number;
    percentageComplete: number;
  };
}

interface VehicleStateResponse {
  batteryLevel: number;
  batteryRange: number;
  chargingState: string;
  location: {
    lat: number;
    lng: number;
    city: string;
    state: string;
  };
  driving: {
    speed: number;
    odometer: number;
    shiftState: string;
  };
  climate: {
    insideTemp: number;
    outsideTemp: number;
    climateOn: boolean;
  };
  security: {
    locked: boolean;
  };
  timestamp: string;
  lastUpdate: string;
}
