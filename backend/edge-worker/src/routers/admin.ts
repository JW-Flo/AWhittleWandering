import { Hono } from 'hono';
import { CacheService } from '../services/cache';
import { persistCronRun } from '../utils/cronMetrics';
import { z } from 'zod';
import { signJwtHS256 } from '../utils/jwtHs256';
import { TeslaDataIngestion } from '../data-ingestion';
import type { Env } from '../types/env';

export const adminRouter = new Hono<{ Bindings: Env }>();

// Auth is enforced at the app layer via `Authorization: Bearer <ADMIN_TOKEN>` on `/api/v1/admin/*`
// (see `src/index.ts`). Keep this router focused on admin functionality only.

adminRouter.post('/auth/token', async (c) => {
  // This route is already protected by the adminAuth middleware at the app layer.
  // It mints a short-lived admin JWT, enabling safe rotations via JWT_SECRET(_PREVIOUS).
  const env = c.env;
  const jwtSecret = String(env?.JWT_SECRET || '').trim();
  if (!jwtSecret) {
    return c.json({ ok: false, error: 'JWT_SECRET not configured' }, 503);
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const ttlSec = 60 * 60; // 1h
  const payload = {
    admin: true,
    scope: 'admin',
    iat: nowSec,
    exp: nowSec + ttlSec,
    jti: (() => {
      try { return crypto.randomUUID(); } catch { return String(nowSec); }
    })(),
  };

  const token = await signJwtHS256(payload, jwtSecret);
  return c.json({ ok: true, token, expiresInSec: ttlSec });
});

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
    tessieConfigured: !!env?.TESSIE_API_TOKEN,
    environment: env?.ENVIRONMENT || 'unknown',
    platformMode: env?.PLATFORM_MODE || 'live'
  };

  return c.json(status);
});

// Manual data ingestion trigger - pulls fresh data from Tessie API
adminRouter.post('/ingest', async (c) => {
  const env = c.env;
  if (!env?.TESLA_DB) return c.json({ ok: false, error: 'No DB bound' }, 500);

  const tessieKey = env.TESSIE_API_TOKEN || '';
  if (!tessieKey) return c.json({ ok: false, error: 'No Tessie API token configured' }, 503);

  // Get VIN from secrets or database
  let vin = env.TESLA_VIN || '';
  if (!vin) {
    // Fallback: try to get from database
    try {
      const vehicle = await env.TESLA_DB.prepare(
        'SELECT vin FROM vehicles WHERE id = ?'
      ).bind('midnight-shadow').first<{ vin: string }>();
      vin = vehicle?.vin || '';
    } catch (e) {
      // ignore
    }
  }

  if (!vin || vin === 'UNKNOWN_VIN') {
    return c.json({ ok: false, error: 'VIN not configured. Set TESLA_VIN secret or update vehicles table.' }, 503);
  }

  try {
    const ingestion = new TeslaDataIngestion(env.TESLA_DB, tessieKey, vin);
    const result = await ingestion.ingestAllData();

    // Log the manual ingestion
    try {
      await env.TESLA_DB.prepare(`
        INSERT INTO ingestion_logs
        (operation, records_processed, success, errors, duration_ms, api_calls_made, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        'manual_ingest',
        result.recordsProcessed,
        result.success,
        JSON.stringify(result.errors),
        0, // duration not tracked for manual
        0,  // api calls not tracked
        result.timestamp
      ).run();
    } catch (logError) {
      // Don't fail the ingestion if logging fails
      console.error('Failed to log manual ingestion:', logError);
    }

    return c.json({
      ok: true,
      operation: 'manual_ingest',
      success: result.success,
      recordsProcessed: result.recordsProcessed,
      errors: result.errors,
      timestamp: result.timestamp,
      message: result.success
        ? `Successfully ingested ${result.recordsProcessed} records`
        : `Ingestion completed with ${result.errors.length} errors`
    }, result.success ? 200 : 207); // 207 = Multi-Status for partial success

  } catch (error: any) {
    console.error('Manual ingestion failed:', error);
    return c.json({
      ok: false,
      operation: 'manual_ingest',
      error: error.message || 'Unknown error during ingestion',
      timestamp: new Date().toISOString()
    }, 500);
  }
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

// Vehicle onboarding endpoint - allows admin to add/update vehicles with purchase date
const vehicleOnboardSchema = z.object({
  id: z.string().min(1).max(100),
  vin: z.string().length(17).regex(/^[A-HJ-NPR-Z0-9]+$/, 'Invalid VIN format (uppercase letters A-HJ-NPR-Z and digits 0-9 only)'),
  display_name: z.string().min(1).max(200).optional(),
  model: z.string().min(1).max(50).optional(),
  year: z.number().int().min(2012).max(new Date().getFullYear() + 1).optional(),
  color: z.string().max(50).optional(),
  purchased_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').refine(
    (dateStr) => {
      const date = new Date(dateStr);
      const earliest = new Date('2012-06-01');
      const now = new Date();
      return date >= earliest && date <= now;
    },
    'purchased_date must be between 2012-06-01 and today'
  ).optional()
});

adminRouter.post('/vehicles', async (c) => {
  const env = c.env;
  if (!env?.TESLA_DB) return c.json({ ok: false, error: 'No DB bound' }, 500);

  try {
    const body = await c.req.json();
    const parsed = vehicleOnboardSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({
        ok: false,
        error: 'Validation failed',
        details: parsed.error.format()
      }, 400);
    }

    const vehicle = parsed.data;
    const now = new Date().toISOString();

    // Check if vehicle already exists
    const existing = await env.TESLA_DB.prepare(
      'SELECT id, vin FROM vehicles WHERE id = ? OR vin = ?'
    ).bind(vehicle.id, vehicle.vin).first<{ id: string; vin: string }>();

    if (existing) {
      // Update existing vehicle
      const updateFields: string[] = ['vin = ?', 'updated_at = ?'];
      const updateValues: (string | number | null)[] = [vehicle.vin, now];

      if (vehicle.display_name) {
        updateFields.push('display_name = ?');
        updateValues.push(vehicle.display_name);
      }
      if (vehicle.model) {
        updateFields.push('model = ?');
        updateValues.push(vehicle.model);
      }
      if (vehicle.year) {
        updateFields.push('year = ?');
        updateValues.push(vehicle.year);
      }
      if (vehicle.color) {
        updateFields.push('color = ?');
        updateValues.push(vehicle.color);
      }
      if (vehicle.purchased_date) {
        updateFields.push('purchased_date = ?');
        updateValues.push(vehicle.purchased_date);
      }

      updateValues.push(vehicle.id);

      await env.TESLA_DB.prepare(
        `UPDATE vehicles SET ${updateFields.join(', ')} WHERE id = ?`
      ).bind(...updateValues).run();

      return c.json({
        ok: true,
        action: 'updated',
        vehicle: {
          id: vehicle.id,
          vin: vehicle.vin,
          purchased_date: vehicle.purchased_date
        },
        message: 'Vehicle updated successfully'
      });
    } else {
      // Insert new vehicle
      await env.TESLA_DB.prepare(
        `INSERT INTO vehicles (id, vin, display_name, model, year, color, purchased_date, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        vehicle.id,
        vehicle.vin,
        vehicle.display_name || null,
        vehicle.model || null,
        vehicle.year || null,
        vehicle.color || null,
        vehicle.purchased_date || null,
        now,
        now
      ).run();

      return c.json({
        ok: true,
        action: 'created',
        vehicle: {
          id: vehicle.id,
          vin: vehicle.vin,
          purchased_date: vehicle.purchased_date
        },
        message: 'Vehicle onboarded successfully. Historical data imports will use the purchased_date as the start boundary.'
      }, 201);
    }
  } catch (error: any) {
    console.error('Vehicle onboarding failed:', error);
    return c.json({
      ok: false,
      error: error.message || 'Failed to onboard vehicle',
      timestamp: new Date().toISOString()
    }, 500);
  }
});