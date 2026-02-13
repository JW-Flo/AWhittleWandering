import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { Env } from '../types/env';
import { logger } from '../utils/log';
import { DEFAULT_JOURNEY_ID, DEFAULT_VEHICLE_ID } from '../utils/resolveJourney';

export const vehicleRouter = new Hono<{ Bindings: Env }>();

const querySchema = z.object({
  journeyId: z.string().min(1).optional(),
  vehicleId: z.string().min(1).optional(),
});

function ageSeconds(ts?: string | null) {
  if (!ts) return null;
  const ms = new Date(ts).getTime();
  if (Number.isNaN(ms)) return null;
  return Math.round((Date.now() - ms) / 1000);
}

vehicleRouter.get('/state/enhanced', zValidator('query', querySchema), async (c) => {
  const db = c.env?.TESLA_DB;
  if (!db) return c.json({ ok: false, error: 'Database not configured' }, 200);

  const query = c.req.valid('query');
  const journeyId = query.journeyId || DEFAULT_JOURNEY_ID;
  const vehicleId = query.vehicleId || DEFAULT_VEHICLE_ID;

  try {
    const vs = await db.prepare(
      `SELECT * FROM vehicle_state WHERE vehicle_id = ? LIMIT 1`
    ).bind(vehicleId).first();

    const lastDrive = await db.prepare(
      `SELECT id, started_at, ended_at, start_address, end_address, distance_miles
       FROM drives WHERE journey_id = ?
       ORDER BY started_at DESC LIMIT 1`
    ).bind(journeyId).first();

    const lastCharge = await db.prepare(
      `SELECT id, started_at, ended_at, location, energy_added_kwh
       FROM charges WHERE journey_id = ?
       ORDER BY started_at DESC LIMIT 1`
    ).bind(journeyId).first();

    const ts = (vs as any)?.timestamp as string | undefined;

    return c.json({
      ok: true,
      vehicleId,
      timestamp: new Date().toISOString(),
      state: vs || null,
      freshness: {
        lastUpdate: ts || null,
        ageSeconds: ageSeconds(ts)
      },
      recent: {
        lastDrive: lastDrive || null,
        lastCharge: lastCharge || null
      }
    });
  } catch (err: any) {
    logger.error('vehicle.state.enhanced.error', { error: err?.message });
    return c.json({ ok: false, error: 'Failed to fetch enhanced vehicle state' }, 200);
  }
});
