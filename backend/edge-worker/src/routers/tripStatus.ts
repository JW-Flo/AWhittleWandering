import { Hono } from 'hono';

export const tripStatusRouter = new Hono();

tripStatusRouter.get('/', async (c) => {
  return c.json({
    tripId: "continental-usa-2025",
    tripName: `Tesla Road Trip - ${new Date().getFullYear()}`,
    status: "active",
    timestamp: Date.now()
  });
});

tripStatusRouter.get('/config', async (c) => {
  const config = {
    // Mapbox token from environment (prefer MAPBOX_API_TOKEN if available)
    mapboxToken: c.env?.MAPBOX_API_TOKEN || null,
    apiBaseUrl: 'https://awhittlewandering-api.kd8jc7v8cd.workers.dev',
    appName: 'Tesla Road Trip Tracker',
    apiVersion: '3.0.0',
    features: {
      liveTeslaData: !!(c.env?.TESSIE_API_TOKEN || c.env?.TESSIE_API_KEY),
      mapIntegration: !!c.env?.MAPBOX_API_TOKEN,
      realtimeUpdates: true
    },
    updateInterval: 30000 // 30 seconds
  };

  return c.json(config);
});