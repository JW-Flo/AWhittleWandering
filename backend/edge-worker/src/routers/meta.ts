import { Hono } from 'hono';
import type { Env } from '../types/env';

export const metaRouter = new Hono<{ Bindings: Env }>();

metaRouter.get('/routes', async (c) => {
  // Keep this static and conservative (don’t leak secrets or internal hostnames).
  return c.json({
    ok: true,
    version: '3.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      core: [
        '/api/v1/health',
        '/api/v1/unified-data',
        '/api/v1/telemetry',
        '/api/v1/trip-status',
        '/api/v1/trip/status (alias)'
      ],
      components: [
        '/api/v1/component/overview',
        '/api/v1/component/current-status',
        '/api/v1/component/states-progress',
        '/api/v1/component/recent-drives'
      ],
      analytics: [
        '/api/v1/analytics/comprehensive',
        '/api/v1/analytics/efficiency',
        '/api/v1/analytics/charging'
      ],
      vehicle: [
        '/api/v1/vehicle/state/enhanced'
      ],
      ai: [
        '/api/v1/route/optimize',
        '/api/v1/journal/generate'
      ],
      admin: [
        '/api/v1/admin/status',
        '/api/v1/admin/cache/clear',
        '/api/v1/admin/cron/metrics'
      ]
    }
  });
});

