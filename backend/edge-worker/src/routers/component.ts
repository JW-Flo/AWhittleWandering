import { Hono } from 'hono';
import { z } from 'zod';
import { logger } from '../utils/log';
import type { Env } from '../types/env';

export const componentRouter = new Hono<{ Bindings: Env }>();

const JOURNEY_ID = 'continental-usa-2025';
const VEHICLE_ID = 'midnight-shadow';

const limitSchema = z.object({
  limit: z.string().regex(/^\d+$/).optional()
});

function safeLimit(q: unknown, def = 25) {
  const parsed = limitSchema.safeParse(q);
  const n = parsed.success ? Number(parsed.data.limit || def) : def;
  return Math.min(100, Math.max(1, n));
}

componentRouter.get('/overview', async (c) => {
  const db = c.env?.TESLA_DB;
  if (!db) return c.json({ ok: false, error: 'Database not configured' }, 200);

  try {
    const journey = await db.prepare(
      `SELECT id, name, start_date, target_states, total_miles, total_drives, total_charges, status
       FROM journeys WHERE id = ? LIMIT 1`
    ).bind(JOURNEY_ID).first();

    const vs = await db.prepare(
      `SELECT odometer FROM vehicle_state WHERE vehicle_id = ? LIMIT 1`
    ).bind(VEHICLE_ID).first();

    return c.json({
      ok: true,
      journeyId: JOURNEY_ID,
      tripName: (journey as any)?.name || 'A Whittle Wandering - Continental USA',
      startDate: (journey as any)?.start_date || '2025-06-01',
      totalStates: Number((journey as any)?.target_states || 48),
      statesVisited: Number((await db.prepare(`SELECT COUNT(*) as cnt FROM states_visited WHERE journey_id = ?`).bind(JOURNEY_ID).first() as any)?.cnt || 0),
      totalMiles: Number((journey as any)?.total_miles || 0),
      totalDrives: Number((journey as any)?.total_drives || 0),
      totalCharges: Number((journey as any)?.total_charges || 0),
      currentOdometer: Number((vs as any)?.odometer || 0),
      status: (journey as any)?.status || 'active',
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    logger.error('component.overview.error', { error: err?.message });
    return c.json({ ok: false, error: 'Failed to fetch overview' }, 200);
  }
});

componentRouter.get('/current-status', async (c) => {
  const db = c.env?.TESLA_DB;
  if (!db) return c.json({ ok: false, error: 'Database not configured' }, 200);

  try {
    const vs = await db.prepare(
      `SELECT battery_level, battery_range, charging_state, latitude, longitude, heading, speed, odometer,
              inside_temp, outside_temp, timestamp, state_name, city
       FROM vehicle_state WHERE vehicle_id = ? LIMIT 1`
    ).bind(VEHICLE_ID).first();

    if (!vs) return c.json({ ok: false, error: 'No vehicle state' }, 200);

    return c.json({
      ok: true,
      battery: {
        level: Number((vs as any).battery_level || 0),
        range: Number((vs as any).battery_range || 0),
        charging: (vs as any).charging_state || 'Unknown'
      },
      location: {
        coordinates: { lat: Number((vs as any).latitude || 0), lng: Number((vs as any).longitude || 0) },
        city: (vs as any).city || 'Unknown',
        state: (vs as any).state_name || 'Unknown',
        lastUpdate: (vs as any).timestamp || new Date().toISOString()
      },
      vehicle: {
        odometer: Number((vs as any).odometer || 0),
        speed: Number((vs as any).speed || 0),
        heading: Number((vs as any).heading || 0),
        temperature: { inside: (vs as any).inside_temp ?? null, outside: (vs as any).outside_temp ?? null }
      }
    });
  } catch (err: any) {
    logger.error('component.currentStatus.error', { error: err?.message });
    return c.json({ ok: false, error: 'Failed to fetch current status' }, 200);
  }
});

componentRouter.get('/states-progress', async (c) => {
  const db = c.env?.TESLA_DB;
  if (!db) return c.json({ ok: false, error: 'Database not configured', states: [] }, 200);

  try {
    const rows = await db.prepare(
      `SELECT state_name, state_code, first_visited_date, visit_count, total_miles_in_state, is_current_state
       FROM states_visited WHERE journey_id = ?
       ORDER BY first_visited_date ASC, state_name ASC`
    ).bind(JOURNEY_ID).all();

    return c.json({ ok: true, states: (rows as any)?.results || [] });
  } catch (err: any) {
    logger.error('component.statesProgress.error', { error: err?.message });
    return c.json({ ok: false, error: 'Failed to fetch states progress', states: [] }, 200);
  }
});

componentRouter.get('/recent-drives', async (c) => {
  const db = c.env?.TESLA_DB;
  const limit = safeLimit(c.req.query(), 10);
  if (!db) return c.json({ ok: false, error: 'Database not configured', drives: [] }, 200);

  try {
    const rows = await db.prepare(
      `SELECT id, started_at, ended_at, start_address, end_address, distance_miles, duration_minutes, energy_used_kwh, start_state, end_state
       FROM drives WHERE journey_id = ?
       ORDER BY started_at DESC
       LIMIT ?`
    ).bind(JOURNEY_ID, limit).all();

    return c.json({ ok: true, drives: (rows as any)?.results || [] });
  } catch (err: any) {
    logger.error('component.recentDrives.error', { error: err?.message });
    return c.json({ ok: false, error: 'Failed to fetch recent drives', drives: [] }, 200);
  }
});

