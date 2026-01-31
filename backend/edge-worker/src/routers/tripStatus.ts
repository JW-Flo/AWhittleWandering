import { Hono } from 'hono';
import type { Context } from 'hono';
import type { Env } from '../types/env';

export const tripStatusRouter = new Hono<{ Bindings: Env }>();

tripStatusRouter.get('/', async (c: Context) => {
  return c.json({
    tripId: "continental-usa-2025",
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
      liveTeslaData: Boolean(c.env?.TESSIE_API_TOKEN || c.env?.TESSIE_API_KEY),
      mapIntegration: Boolean(c.env?.MAPBOX_API_TOKEN),
      realtimeUpdates: true
    },
    updateInterval: 30000 // 30 seconds
  };

  return c.json(config);
});