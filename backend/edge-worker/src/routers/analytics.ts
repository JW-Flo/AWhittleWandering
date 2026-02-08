import { Hono } from 'hono';
import { z } from 'zod';
import { logger } from '../utils/log';
import type { Env } from '../types/env';

export const analyticsRouter = new Hono<{ Bindings: Env }>();

const DEFAULT_JOURNEY_ID = 'continental-usa-2025';

const querySchema = z.object({
  limit: z.string().regex(/^\d+$/).optional(),
  journeyId: z.string().min(1).optional(),
});

function parseQuery(q: unknown, defaultLimit: number) {
  const parsed = querySchema.safeParse(q);
  if (!parsed.success) return { journeyId: DEFAULT_JOURNEY_ID, limit: defaultLimit };
  return {
    journeyId: parsed.data.journeyId || DEFAULT_JOURNEY_ID,
    limit: Math.min(365, Math.max(1, Number(parsed.data.limit || defaultLimit))),
  };
}

// Computed summary endpoint for the frontend analytics dashboard
analyticsRouter.get('/summary', async (c) => {
  const db = c.env?.TESLA_DB;
  const { journeyId } = parseQuery(c.req.query(), 90);
  if (!db) return c.json({ ok: false, error: 'Database not configured' }, 200);

  try {
    const driveStats = await db.prepare(
      `SELECT COUNT(*) as total_drives,
              COALESCE(SUM(distance_miles), 0) as total_distance,
              COALESCE(SUM(energy_used_kwh), 0) as total_energy
       FROM drives WHERE journey_id = ?`
    ).bind(journeyId).first();

    const chargeStats = await db.prepare(
      `SELECT COUNT(*) as total_charges,
              COALESCE(SUM(energy_added_kwh), 0) as total_energy_added,
              COALESCE(SUM(cost_usd), 0) as total_cost
       FROM charges WHERE journey_id = ?`
    ).bind(journeyId).first();

    const totalDistance = Number((driveStats as any)?.total_distance || 0);
    const totalEnergy = Number((driveStats as any)?.total_energy || 0);
    const totalCost = Number((chargeStats as any)?.total_cost || 0);
    const avgEfficiency = totalEnergy > 0 ? totalDistance / totalEnergy : 0;
    // Approximate: avg ICE = $0.12/mi, EV actual cost per mile
    const costPerMile = totalDistance > 0 ? totalCost / totalDistance : 0;
    const gasCostEquivalent = totalDistance * 0.12;
    const costSavings = gasCostEquivalent - totalCost;
    // ~0.92 lbs CO2 per mile for avg ICE vehicle
    const carbonSaved = totalDistance * 0.92;

    return c.json({
      ok: true,
      journeyId,
      totalDistance,
      totalEnergy,
      averageEfficiency: Math.round(avgEfficiency * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      costPerMile: Math.round(costPerMile * 1000) / 1000,
      costSavings: Math.round(costSavings * 100) / 100,
      carbonSaved: Math.round(carbonSaved),
      totalDrives: Number((driveStats as any)?.total_drives || 0),
      totalCharges: Number((chargeStats as any)?.total_charges || 0),
      totalEnergyAdded: Number((chargeStats as any)?.total_energy_added || 0),
    });
  } catch (err: any) {
    logger.error('analytics.summary.error', { error: err?.message });
    return c.json({ ok: false, error: 'Failed to compute analytics summary' }, 200);
  }
});

analyticsRouter.get('/comprehensive', async (c) => {
  const db = c.env.TESLA_DB;
  const { journeyId, limit } = parseQuery(c.req.query(), 90);
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
    ).bind(journeyId, limit).all();

    return c.json({ ok: true, daily: (rows as any)?.results || [] });
  } catch (err: any) {
    logger.error('analytics.comprehensive.error', { error: err?.message });
    return c.json({ ok: false, error: 'Failed to fetch analytics', daily: [] }, 200);
  }
});

analyticsRouter.get('/efficiency', async (c) => {
  const db = c.env?.TESLA_DB;
  const { journeyId, limit } = parseQuery(c.req.query(), 120);
  if (!db) return c.json({ ok: false, error: 'Database not configured', efficiency: [] }, 200);

  try {
    const rows = await db.prepare(
      `SELECT date, miles_driven, energy_consumed_kwh, efficiency_miles_per_kwh, avg_outside_temp_f, avg_speed_mph
       FROM efficiency_metrics
       WHERE journey_id = ?
       ORDER BY date DESC
       LIMIT ?`
    ).bind(journeyId, limit).all();

    return c.json({ ok: true, efficiency: (rows as any)?.results || [] });
  } catch (err: any) {
    logger.error('analytics.efficiency.error', { error: err?.message });
    return c.json({ ok: false, error: 'Failed to fetch efficiency analytics', efficiency: [] }, 200);
  }
});

analyticsRouter.get('/charging', async (c) => {
  const db = c.env?.TESLA_DB;
  const { journeyId } = parseQuery(c.req.query(), 90);
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
    ).bind(journeyId).all();

    return c.json({ ok: true, byChargerType: (rows as any)?.results || [] });
  } catch (err: any) {
    logger.error('analytics.charging.error', { error: err?.message });
    return c.json({ ok: false, error: 'Failed to fetch charging analytics', byChargerType: [] }, 200);
  }
});
