import { Hono } from 'hono';
import { logger } from '../utils/log';

export const vehicleRouter = new Hono();

const JOURNEY_ID = 'continental-usa-2025';
const VEHICLE_ID = 'midnight-shadow';

function ageSeconds(ts?: string | null) {
  if (!ts) return null;
  const ms = new Date(ts).getTime();
  if (Number.isNaN(ms)) return null;
  return Math.round((Date.now() - ms) / 1000);
}

vehicleRouter.get('/state/enhanced', async (c) => {
  const db = c.env?.TESLA_DB;
  if (!db) return c.json({ ok: false, error: 'Database not configured' }, 200);

  try {
    const vs = await db.prepare(
      `SELECT * FROM vehicle_state WHERE vehicle_id = ? LIMIT 1`
    ).bind(VEHICLE_ID).first();

    const lastDrive = await db.prepare(
      `SELECT id, started_at, ended_at, start_address, end_address, distance_miles
       FROM drives WHERE journey_id = ?
       ORDER BY started_at DESC LIMIT 1`
    ).bind(JOURNEY_ID).first();

    const lastCharge = await db.prepare(
      `SELECT id, started_at, ended_at, location, energy_added_kwh
       FROM charges WHERE journey_id = ?
       ORDER BY started_at DESC LIMIT 1`
    ).bind(JOURNEY_ID).first();

    const ts = (vs as any)?.timestamp as string | undefined;

    return c.json({
      ok: true,
      vehicleId: VEHICLE_ID,
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

