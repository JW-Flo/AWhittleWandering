import { Hono } from 'hono';
import type { Context } from 'hono';
import type { Env } from '../types/env';
import { DEFAULT_JOURNEY_ID } from '../utils/resolveJourney';

export const tripStatusRouter = new Hono<{ Bindings: Env }>();

tripStatusRouter.get('/', async (c: Context) => {
  // Look up the active journey's public_id if DB is available
  let publicId: number | null = null;
  const db = (c.env as any)?.TESLA_DB;
  if (db) {
    try {
      const row = await db.prepare(
        'SELECT public_id FROM journey_public_ids WHERE journey_id = ? LIMIT 1'
      ).bind(DEFAULT_JOURNEY_ID).first();
      publicId = (row as any)?.public_id ?? null;
    } catch { /* soft-fail */ }
  }

  return c.json({
    tripId: publicId ?? DEFAULT_JOURNEY_ID,
    tripName: `A Whittle Wandering - ${new Date().getFullYear()}`,
    status: "active",
    timestamp: Date.now()
  });
});

tripStatusRouter.get('/config', async (c: Context) => {
  // SECURITY: Only expose public tokens (pk.*). Never expose secret tokens (sk.*).
  const publicToken = c.env?.MAPBOX_PUBLIC_TOKEN || null;
  const apiToken = c.env?.MAPBOX_API_TOKEN || null;
  const safeToken = publicToken ?? (apiToken && !apiToken.startsWith('sk.') ? apiToken : null);

  const url = new URL(c.req.url);
  const config = {
    mapboxToken: safeToken ?? undefined,
    apiBaseUrl: `${url.protocol}//${url.host}`,
    appName: 'A Whittle Wandering',
    apiVersion: '3.0.0',
    features: {
      liveTeslaData: Boolean(c.env?.TESSIE_API_TOKEN),
      mapIntegration: Boolean(safeToken),
      realtimeUpdates: true
    },
    updateInterval: 30000
  };

  return c.json(config);
});