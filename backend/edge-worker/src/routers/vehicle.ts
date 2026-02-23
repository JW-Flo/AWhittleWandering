import { Hono } from 'hono';
import { z } from 'zod';
import type { Env } from '../types/env';
import { logger } from '../utils/log';
import { DEFAULT_JOURNEY_ID, DEFAULT_VEHICLE_ID } from '../utils/resolveJourney';

export const vehicleRouter = new Hono<{ Bindings: Env }>();

const querySchema = z.object({
  journeyId: z.string().min(1).optional(),
  vehicleId: z.string().min(1).optional(),
});

function parseQuery(q: unknown) {
  const parsed = querySchema.safeParse(q);
  if (!parsed.success) return { journeyId: DEFAULT_JOURNEY_ID, vehicleId: DEFAULT_VEHICLE_ID };
  return {
    journeyId: parsed.data.journeyId || DEFAULT_JOURNEY_ID,
    vehicleId: parsed.data.vehicleId || DEFAULT_VEHICLE_ID,
  };
}

function ageSeconds(ts?: string | null) {
  if (!ts) return null;
  const ms = new Date(ts).getTime();
  if (Number.isNaN(ms)) return null;
  return Math.round((Date.now() - ms) / 1000);
}

vehicleRouter.get('/test-connection', async (c) => {
  const tessieToken = c.env?.TESSIE_API_TOKEN;
  if (!tessieToken) {
    return c.json({ ok: false, error: 'TESSIE_API_TOKEN not configured' }, 503);
  }

  try {
    const vin = c.env?.TESLA_VIN || '';
    const resp = await fetch(`https://api.tessie.com/${vin}/state`, {
      headers: { Authorization: `Bearer ${tessieToken}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
    });

    if (resp.ok) {
      return c.json({ ok: true, status: resp.status, provider: 'tessie' });
    }
    return c.json({ ok: false, status: resp.status, error: `Tessie API returned ${resp.status}` }, 502);
  } catch (err: any) {
    logger.error('vehicle.test-connection.error', { error: err?.message });
    return c.json({ ok: false, error: err?.message || 'Connection failed' }, 502);
  }
});

vehicleRouter.get('/state/enhanced', async (c) => {
  const db = c.env?.TESLA_DB;
  if (!db) return c.json({ ok: false, error: 'Database not configured' }, 200);
  const { journeyId, vehicleId } = parseQuery(c.req.query());

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
