import { Hono } from 'hono';
import { CacheService } from '../services/cache';
import { persistCronRun } from '../utils/cronMetrics';

// Augment Env typing locally for this module
declare global {
  interface Env {
    ADMIN_TOKEN?: string;
    TESLA_DB?: any;
    TESSIE_API_KEY?: string;
    ENVIRONMENT?: string;
    PLATFORM_MODE?: string;
  }
}

export const adminRouter = new Hono<{ Bindings: Env }>();

// Admin authentication middleware
adminRouter.use('*', async (c, next) => {
  const token = c.req.header('X-Admin-Token');
  const env = c.env;
  const expectedToken = env?.ADMIN_TOKEN;

  // If no admin token is configured, allow access (dev mode)
  if (!expectedToken) {
    await next();
    return;
  }

  if (!token || token !== expectedToken) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  await next();
});

adminRouter.post('/cache/clear', async (c) => {
  try {
    // Clear specific unified data cache
    await CacheService.delete(c, 'unified_data_latest_v2');
    
    // If D1 is available, clear broader cache patterns
  const env = c.env;
    if (env?.TESLA_DB) {
      await env.TESLA_DB.prepare(`DELETE FROM api_cache WHERE cache_key LIKE 'unified_data%'`).run();
    }

    return c.json({
      success: true,
      message: 'Cache cleared',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to clear cache',
      timestamp: new Date().toISOString()
    }, 500);
  }
});

adminRouter.get('/status', async (c) => {
  const env = c.env;
  const status = {
    service: 'A Whittle Wandering Admin',
    timestamp: new Date().toISOString(),
    adminTokenConfigured: !!env?.ADMIN_TOKEN,
    dbAvailable: !!env?.TESLA_DB,
    tessieConfigured: !!env?.TESSIE_API_KEY,
    environment: env?.ENVIRONMENT || 'unknown',
    platformMode: env?.PLATFORM_MODE || 'live'
  };

  return c.json(status);
});

// Lightweight cron metrics inspection (last 25 rows) – errors tolerated
adminRouter.get('/cron/metrics', async (c) => {
  const env = c.env;
  if (!env?.TESLA_DB) return c.json({ ok: false, error: 'No DB bound' }, 500);
  try {
    const rows = await env.TESLA_DB.prepare(`SELECT job, cron, started_at, finished_at, duration_ms, success, error
      FROM cron_metrics ORDER BY id DESC LIMIT 25`).all();
    return c.json({ ok: true, count: rows.results?.length || 0, rows: rows.results });
  } catch (e:any) {
    return c.json({ ok: false, error: e?.message || 'query failed' }, 500);
  }
});