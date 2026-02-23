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

// Full historical backfill - fetches ALL drives and charges from Tessie with pagination
adminRouter.post('/backfill', async (c) => {
  const env = c.env;
  if (!env?.TESLA_DB) return c.json({ ok: false, error: 'No DB bound' }, 500);

  const tessieKey = env.TESSIE_API_TOKEN || '';
  if (!tessieKey) return c.json({ ok: false, error: 'No Tessie API token configured' }, 503);

  let vin = env.TESLA_VIN || '';
  if (!vin) {
    try {
      const vehicle = await env.TESLA_DB.prepare(
        'SELECT vin FROM vehicles WHERE id = ?'
      ).bind('midnight-shadow').first<{ vin: string }>();
      vin = vehicle?.vin || '';
    } catch { /* ignore */ }
  }
  if (!vin || vin === 'UNKNOWN_VIN') {
    return c.json({ ok: false, error: 'VIN not configured' }, 503);
  }

  try {
    const ingestion = new TeslaDataIngestion(env.TESLA_DB, tessieKey, vin);
    await ingestion.ensureVehicleAndJourney();

    const results = { drives: 0, charges: 0, errors: [] as string[] };
    const baseUrl = 'https://api.tessie.com';
    const headers = {
      'Authorization': `Bearer ${tessieKey}`,
      'Content-Type': 'application/json'
    };

    // Import helper from data-ingestion for state detection
    const { detectStateFromCoordinates, updateStatesVisited } = await import('../services/state-detection');

    const normalizeIso = (ts: unknown): string | null => {
      if (ts == null) return null;
      if (typeof ts === 'number') {
        const ms = ts < 1e12 ? ts * 1000 : ts;
        const d = new Date(ms);
        return isNaN(d.getTime()) ? null : d.toISOString();
      }
      if (typeof ts === 'string') {
        const n = Number(ts);
        if (!Number.isNaN(n) && /^\d{9,13}$/.test(ts)) {
          const ms = ts.length === 13 ? n : n * 1000;
          const d = new Date(ms);
          return isNaN(d.getTime()) ? null : d.toISOString();
        }
        const d = new Date(ts);
        return isNaN(d.getTime()) ? null : d.toISOString();
      }
      return null;
    };

    // Paginate all drives
    let page = 1;
    let hasMore = true;
    while (hasMore) {
      const url = `${baseUrl}/${vin}/drives?per_page=100&page=${page}`;
      const res = await fetch(url, { headers });
      if (!res.ok) {
        results.errors.push(`Drives page ${page}: HTTP ${res.status}`);
        break;
      }
      const json = await res.json() as any;
      const driveList = Array.isArray(json?.results) ? json.results : (Array.isArray(json) ? json : []);
      if (driveList.length === 0) { hasMore = false; break; }

      for (const drive of driveList) {
        try {
          const startedAt = normalizeIso(drive.started_at);
          if (!startedAt) { results.errors.push(`Drive ${drive.id}: bad started_at`); continue; }
          let endedAt = normalizeIso(drive.ended_at);
          let durationMinutes = 0;

          if (!endedAt && typeof drive.started_at === 'number' && typeof drive.ended_at === 'number') {
            const startMs = drive.started_at < 1e12 ? drive.started_at * 1000 : drive.started_at;
            const endMs = drive.ended_at < 1e12 ? drive.ended_at * 1000 : drive.ended_at;
            const d = new Date(endMs);
            if (!isNaN(d.getTime()) && endMs > startMs) {
              endedAt = d.toISOString();
              durationMinutes = Math.round((endMs - startMs) / 60000);
            }
          }
          if (!endedAt) { endedAt = startedAt; }
          if (!durationMinutes && endedAt !== startedAt) {
            durationMinutes = Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60000);
          }

          let startState: string | null = null;
          let endState: string | null = null;
          try {
            if (drive.starting_latitude && drive.starting_longitude) {
              const s = await detectStateFromCoordinates(drive.starting_latitude, drive.starting_longitude);
              if (s) {
                startState = s.name;
                await updateStatesVisited(env.TESLA_DB, 'continental-usa-2025', s.code, s.name, drive.starting_latitude, drive.starting_longitude, drive.id);
              }
            }
            if (drive.ending_latitude && drive.ending_longitude) {
              const s = await detectStateFromCoordinates(drive.ending_latitude, drive.ending_longitude);
              if (s) { endState = s.name; await updateStatesVisited(env.TESLA_DB, 'continental-usa-2025', s.code, s.name, drive.ending_latitude, drive.ending_longitude, drive.id); }
            }
            if (!endState && startState) endState = startState;
          } catch { /* state detection is best-effort */ }

          await env.TESLA_DB.prepare(`
            INSERT OR REPLACE INTO drives (
              tessie_id, journey_id, vehicle_id, started_at, ended_at,
              start_address, end_address, start_latitude, start_longitude,
              end_latitude, end_longitude, start_state, end_state,
              distance_miles, duration_minutes,
              start_battery_level, end_battery_level, energy_used_kwh,
              outside_temp_avg
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            drive.id, 'continental-usa-2025', 'midnight-shadow',
            startedAt, endedAt,
            drive.starting_location || 'Unknown', drive.ending_location || 'Unknown',
            drive.starting_latitude || 0, drive.starting_longitude || 0,
            drive.ending_latitude || 0, drive.ending_longitude || 0,
            startState, endState,
            drive.odometer_distance || 0, durationMinutes,
            drive.starting_battery || 0, drive.ending_battery || 0,
            drive.energy_used || 0, drive.outside_temp || null
          ).run();
          results.drives++;
        } catch (e: any) {
          results.errors.push(`Drive ${drive.id}: ${e?.message || String(e)}`);
        }
      }
      if (driveList.length < 100) { hasMore = false; } else { page++; }
    }

    // Paginate all charges
    page = 1;
    hasMore = true;
    while (hasMore) {
      const url = `${baseUrl}/${vin}/charges?per_page=100&page=${page}`;
      const res = await fetch(url, { headers });
      if (!res.ok) {
        results.errors.push(`Charges page ${page}: HTTP ${res.status}`);
        break;
      }
      const json = await res.json() as any;
      const chargeList = Array.isArray(json?.results) ? json.results : (Array.isArray(json) ? json : []);
      if (chargeList.length === 0) { hasMore = false; break; }

      for (const charge of chargeList) {
        try {
          const startedAt = normalizeIso(charge.started_at);
          if (!startedAt) { results.errors.push(`Charge ${charge.id}: bad started_at`); continue; }
          const endedAt = normalizeIso(charge.ended_at);

          await env.TESLA_DB.prepare(`
            INSERT OR REPLACE INTO charges (
              tessie_id, journey_id, vehicle_id, started_at, ended_at,
              location, latitude, longitude, energy_added_kwh,
              cost_usd, start_battery_level, end_battery_level,
              charger_type, charger_power_kw
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            charge.id, 'continental-usa-2025', 'midnight-shadow',
            startedAt, endedAt,
            charge.location || 'Unknown',
            charge.latitude || 0, charge.longitude || 0,
            charge.energy_added || 0, charge.cost || 0,
            charge.starting_battery || 0, charge.ending_battery || 0,
            charge.charger_type || null, charge.charger_power || null
          ).run();
          results.charges++;
        } catch (e: any) {
          results.errors.push(`Charge ${charge.id}: ${e?.message || String(e)}`);
        }
      }
      if (chargeList.length < 100) { hasMore = false; } else { page++; }
    }

    // Update journey metadata
    const stats = await env.TESLA_DB.prepare(`
      SELECT COUNT(*) as total_drives, COALESCE(SUM(distance_miles), 0) as total_miles
      FROM drives WHERE journey_id = 'continental-usa-2025'
    `).first();
    const chargeStats = await env.TESLA_DB.prepare(
      `SELECT COUNT(*) as total_charges, COALESCE(SUM(cost_usd), 0) as total_cost
       FROM charges WHERE journey_id = 'continental-usa-2025'`
    ).first();
    const statesCount = await env.TESLA_DB.prepare(
      `SELECT COUNT(*) as cnt FROM states_visited WHERE journey_id = 'continental-usa-2025'`
    ).first();

    await env.TESLA_DB.prepare(`
      UPDATE journeys SET total_miles = ?, total_drives = ?, total_charges = ?,
        total_states = ?, total_cost_usd = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      (stats as any)?.total_miles || 0,
      (stats as any)?.total_drives || 0,
      (chargeStats as any)?.total_charges || 0,
      (statesCount as any)?.cnt || 0,
      (chargeStats as any)?.total_cost || 0,
      'continental-usa-2025'
    ).run();

    // Clear caches
    try {
      await env.TESLA_DB.prepare(`DELETE FROM api_cache WHERE cache_key LIKE 'unified_data%'`).run();
    } catch { /* ignore */ }

    return c.json({
      ok: true,
      operation: 'full_historical_backfill',
      drives: results.drives,
      charges: results.charges,
      errors: results.errors.slice(0, 20),
      totalErrors: results.errors.length,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return c.json({
      ok: false,
      operation: 'full_historical_backfill',
      error: error.message || 'Unknown error',
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