import { Hono } from 'hono';
import { CacheService } from '../services/cache';
import { persistCronRun } from '../utils/cronMetrics';
import { z } from 'zod';

// Augment Env typing locally for this module
declare global {
  interface Env {
    ADMIN_TOKEN?: string;
    TESLA_DB?: any;
    TESSIE_API_TOKEN?: string;
    TESSIE_API_KEY?: string;
    ENVIRONMENT?: string;
    PLATFORM_MODE?: string;
  }
}

export const adminRouter = new Hono<{ Bindings: Env }>();

// Auth is enforced at the app layer via `Authorization: Bearer <ADMIN_TOKEN>` on `/api/v1/admin/*`
// (see `src/index.ts`). Keep this router focused on admin functionality only.

adminRouter.post('/cache/clear', async (c) => {
  try {
    // Clear specific unified data cache
    await CacheService.delete(c, 'unified_data_latest_v2');
    
    // If D1 is available, clear broader cache patterns
  const env = c.env;
    if (env?.TESLA_DB) {
      await env.TESLA_DB.prepare(`DELETE FROM api_cache WHERE cache_key LIKE 'unified_data%'`).run();
    }

    return c.json({
      success: true,
      message: 'Cache cleared',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to clear cache',
      timestamp: new Date().toISOString()
    }, 500);
  }
});

adminRouter.get('/status', async (c) => {
  const env = c.env;
  const status = {
    service: 'A Whittle Wandering Admin',
    timestamp: new Date().toISOString(),
    adminTokenConfigured: !!env?.ADMIN_TOKEN,
    dbAvailable: !!env?.TESLA_DB,
    tessieConfigured: !!(env?.TESSIE_API_TOKEN || env?.TESSIE_API_KEY),
    environment: env?.ENVIRONMENT || 'unknown',
    platformMode: env?.PLATFORM_MODE || 'live'
  };

  return c.json(status);
});

// Lightweight cron metrics inspection (last 25 rows) – errors tolerated
adminRouter.get('/cron/metrics', async (c) => {
  const env = c.env;
  if (!env?.TESLA_DB) return c.json({ ok: false, error: 'No DB bound' }, 500);
  try {
    const rows = await env.TESLA_DB.prepare(`SELECT job, cron, started_at, finished_at, duration_ms, success, error
      FROM cron_metrics ORDER BY id DESC LIMIT 25`).all();
    return c.json({ ok: true, count: rows.results?.length || 0, rows: rows.results });
  } catch (e:any) {
    return c.json({ ok: false, error: e?.message || 'query failed' }, 500);
  }
});

// Read-only allowlisted data access (admin only). This is intentionally conservative:
// - Explicit allowlist (no arbitrary SQL / table names).
// - Pagination enforced.
// - Sensitive fields (IP, user agent, tokens) are not returned.
const dataQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).optional(),
  offset: z.string().regex(/^\d+$/).optional()
});

type ResourceDef = { sql: string; orderBy?: string };
const RESOURCES: Record<string, ResourceDef> = {
  vehicles: { sql: `SELECT id, vin, display_name, vehicle_type, model, year, color, created_at, updated_at FROM vehicles` },
  journeys: { sql: `SELECT id, vehicle_id, name, description, start_date, end_date, total_states, target_states, total_miles, total_drives, total_charges, total_energy_used_kwh, total_cost_usd, overall_efficiency_miles_per_kwh, status, created_at, updated_at FROM journeys` },
  vehicle_state: { sql: `SELECT vehicle_id, vin, battery_level, battery_range, charging_state, latitude, longitude, heading, speed, odometer, inside_temp, outside_temp, shift_state, power, locked, climate_on, car_version, timestamp, state_name, city, address, created_at, updated_at FROM vehicle_state` },
  vehicle_state_history: { sql: `SELECT id, vehicle_id, vin, battery_level, battery_range, charging_state, latitude, longitude, heading, speed, odometer, inside_temp, outside_temp, power, timestamp, created_at FROM vehicle_state_history` },
  drives: { sql: `SELECT id, tessie_id, vehicle_id, journey_id, started_at, ended_at, start_address, end_address, start_latitude, start_longitude, end_latitude, end_longitude, start_state, end_state, distance_miles, duration_minutes, energy_used_kwh, average_speed, max_speed, start_battery_level, end_battery_level, outside_temp_avg, efficiency_miles_per_kwh, route_complexity, created_at FROM drives` },
  charges: { sql: `SELECT id, tessie_id, vehicle_id, journey_id, started_at, ended_at, location, latitude, longitude, state_name, city, charger_type, charger_power_kw, energy_added_kwh, energy_used_kwh, charge_rate_avg, charge_rate_max, peak_charging_rate, start_battery_level, end_battery_level, start_range, end_range, miles_added, cost_usd, cost_per_kwh, duration_minutes, is_supercharger, charge_port_type, charging_efficiency_kw, charging_network, created_at FROM charges` },
  states_visited: { sql: `SELECT id, journey_id, state_name, state_code, first_visited_date, first_drive_id, visit_count, total_miles_in_state, total_time_minutes, entry_latitude, entry_longitude, entry_address, is_current_state, last_updated, created_at FROM states_visited` },
  daily_analytics: { sql: `SELECT id, journey_id, date, total_drives, total_distance_miles, total_energy_used_kwh, total_charges, total_energy_added_kwh, total_cost_usd, avg_speed_mph, max_speed_mph, efficiency_miles_per_kwh, avg_charge_rate_kw, supercharger_sessions, destination_charges, total_charge_time_minutes, states_visited_count, cities_visited_count, created_at, updated_at FROM daily_analytics` },
  efficiency_metrics: { sql: `SELECT id, journey_id, vehicle_id, date, miles_driven, energy_consumed_kwh, efficiency_miles_per_kwh, avg_outside_temp_f, avg_speed_mph, elevation_gain_ft, highway_miles_percent, city_miles_percent, created_at FROM efficiency_metrics` },
  ingestion_logs: { sql: `SELECT id, operation, records_processed, success, errors, duration_ms, api_calls_made, timestamp FROM ingestion_logs` },
  api_cache: { sql: `SELECT cache_key, cache_type, expires_at, created_at, metadata FROM api_cache` },
  media: { sql: `SELECT id, journey_id, vehicle_id, filename, original_filename, mime_type, file_size, r2_object_key, title, description, latitude, longitude, state_name, city, address, taken_at, drive_id, charge_id, tags, is_favorite, view_count, created_at, updated_at FROM media` },
  // Deliberately exclude analytics_events (contains IP/user-agent) from generic export.
};

adminRouter.get('/data/:resource', async (c) => {
  const env = c.env;
  if (!env?.TESLA_DB) return c.json({ ok: false, error: 'No DB bound' }, 500);

  const resource = c.req.param('resource');
  const def = RESOURCES[resource];
  if (!def) return c.json({ ok: false, error: 'Unknown resource', allowed: Object.keys(RESOURCES) }, 400);

  const parsed = dataQuerySchema.safeParse(c.req.query());
  const limit = Math.min(200, Math.max(1, Number(parsed.success ? (parsed.data.limit || '50') : 50)));
  const offset = Math.max(0, Number(parsed.success ? (parsed.data.offset || '0') : 0));

  try {
    const rows = await env.TESLA_DB.prepare(`${def.sql} LIMIT ? OFFSET ?`).bind(limit, offset).all();
    return c.json({
      ok: true,
      resource,
      limit,
      offset,
      count: (rows as any)?.results?.length || 0,
      rows: (rows as any)?.results || []
    });
  } catch (e: any) {
    return c.json({ ok: false, error: e?.message || 'query failed' }, 500);
  }
});