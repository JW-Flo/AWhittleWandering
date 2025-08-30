import { Hono } from 'hono';
import { CacheService } from '../services/cache';

export const adminRouter = new Hono();

// Admin authentication middleware
adminRouter.use('*', async (c, next) => {
  const token = c.req.header('X-Admin-Token');
  const expectedToken = c.env?.ADMIN_TOKEN;

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
    if (c.env?.TESLA_DB) {
      await c.env.TESLA_DB.prepare(`DELETE FROM api_cache WHERE cache_key LIKE 'unified_data%'`).run();
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
  const status = {
    service: 'A Whittle Wandering Admin',
    timestamp: new Date().toISOString(),
    adminTokenConfigured: !!c.env?.ADMIN_TOKEN,
    dbAvailable: !!c.env?.TESLA_DB,
    tessieConfigured: !!c.env?.TESSIE_API_KEY,
    environment: c.env?.ENVIRONMENT || 'unknown'
  };

  return c.json(status);
});