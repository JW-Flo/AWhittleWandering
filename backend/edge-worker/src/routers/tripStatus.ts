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
  const config = {
    // Mapbox token from environment (prefer MAPBOX_API_TOKEN if available)
    // prefer undefined over null for absent env values
    mapboxToken: c.env?.MAPBOX_API_TOKEN ?? undefined,
    apiBaseUrl: 'https://awhittlewandering-api.kd8jc7v8cd.workers.dev',
    appName: 'A Whittle Wandering',
    apiVersion: '3.0.0',
    features: {
      liveTeslaData: Boolean(c.env?.TESSIE_API_TOKEN),
      mapIntegration: Boolean(c.env?.MAPBOX_API_TOKEN),
      realtimeUpdates: true
    },
    updateInterval: 30000 // 30 seconds
  };

  return c.json(config);
});