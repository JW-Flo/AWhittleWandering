import { Hono } from 'hono';
import { z } from 'zod';
import { logger } from '../utils/log';

export const analyticsRouter = new Hono();

const JOURNEY_ID = 'continental-usa-2025';

const querySchema = z.object({
  limit: z.string().regex(/^\d+$/).optional()
});

function limitOf(q: unknown, def: number) {
  const parsed = querySchema.safeParse(q);
  const n = parsed.success ? Number(parsed.data.limit || def) : def;
  return Math.min(365, Math.max(1, n));
}

analyticsRouter.get('/comprehensive', async (c) => {
  const db = c.env?.TESLA_DB;
  const limit = limitOf(c.req.query(), 90);
  if (!db) return c.json({ ok: false, error: 'Database not configured', daily: [] }, 200);

  try {
    const rows = await db.prepare(
      `SELECT date, total_drives, total_distance_miles, total_energy_used_kwh, total_charges, total_energy_added_kwh,
              total_cost_usd, avg_speed_mph, max_speed_mph, efficiency_miles_per_kwh, supercharger_sessions,
              total_charge_time_minutes, states_visited_count, cities_visited_count
       FROM daily_analytics
       WHERE journey_id = ?
       ORDER BY date DESC
       LIMIT ?`
    ).bind(JOURNEY_ID, limit).all();

    return c.json({ ok: true, daily: (rows as any)?.results || [] });
  } catch (err: any) {
    logger.error('analytics.comprehensive.error', { error: err?.message });
    return c.json({ ok: false, error: 'Failed to fetch analytics', daily: [] }, 200);
  }
});

analyticsRouter.get('/efficiency', async (c) => {
  const db = c.env?.TESLA_DB;
  const limit = limitOf(c.req.query(), 120);
  if (!db) return c.json({ ok: false, error: 'Database not configured', efficiency: [] }, 200);

  try {
    const rows = await db.prepare(
      `SELECT date, miles_driven, energy_consumed_kwh, efficiency_miles_per_kwh, avg_outside_temp_f, avg_speed_mph
       FROM efficiency_metrics
       WHERE journey_id = ?
       ORDER BY date DESC
       LIMIT ?`
    ).bind(JOURNEY_ID, limit).all();

    return c.json({ ok: true, efficiency: (rows as any)?.results || [] });
  } catch (err: any) {
    logger.error('analytics.efficiency.error', { error: err?.message });
    return c.json({ ok: false, error: 'Failed to fetch efficiency analytics', efficiency: [] }, 200);
  }
});

analyticsRouter.get('/charging', async (c) => {
  const db = c.env?.TESLA_DB;
  if (!db) return c.json({ ok: false, error: 'Database not configured', byChargerType: [] }, 200);

  try {
    const rows = await db.prepare(
      `SELECT charger_type,
              COUNT(*) as session_count,
              COALESCE(SUM(energy_added_kwh), 0) as total_energy_added_kwh,
              COALESCE(AVG(cost_per_kwh), 0) as avg_cost_per_kwh,
              COALESCE(AVG(duration_minutes), 0) as avg_duration_minutes
       FROM charges
       WHERE journey_id = ?
       GROUP BY charger_type
       ORDER BY session_count DESC`
    ).bind(JOURNEY_ID).all();

    return c.json({ ok: true, byChargerType: (rows as any)?.results || [] });
  } catch (err: any) {
    logger.error('analytics.charging.error', { error: err?.message });
    return c.json({ ok: false, error: 'Failed to fetch charging analytics', byChargerType: [] }, 200);
  }
});

