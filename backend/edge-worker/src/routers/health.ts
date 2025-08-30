import { Hono } from 'hono';

export const healthRouter = new Hono();

healthRouter.get('/', async (c) => {
  const start = Date.now();
  const db = c.env?.TESLA_DB;
  
  const health: any = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '3.0.0',
    service: 'A Whittle Wandering - Unified Cloudflare Stack',
    resources: {
      d1_database: 'unknown',
      r2_storage: 'unknown',
      analytics_engine: 'assumed',
      queue_system: c.env?.DATA_PROCESSOR ? 'configured' : 'not_configured'
    },
    ingestion: {},
    performance: {},
    warnings: [] as string[]
  };

  // Core resource checks
  if (db) {
    try {
      await db.prepare('SELECT 1').first();
      health.resources.d1_database = 'operational';
    } catch (e) {
      health.resources.d1_database = 'error';
      health.status = 'degraded';
      health.warnings.push('D1 database not reachable');
    }
  } else {
    health.warnings.push('D1 database not configured');
  }

  if (c.env?.MEDIA_BUCKET) {
    try {
      await c.env.MEDIA_BUCKET.list({ limit: 1 });
      health.resources.r2_storage = 'operational';
    } catch (e) {
      health.resources.r2_storage = 'error';
      health.status = 'degraded';
      health.warnings.push('R2 storage not reachable');
    }
  } else {
    health.warnings.push('R2 storage not configured');
  }

  // Ingestion / data freshness metrics
  if (db) {
    try {
      const lastVehicleState = await db.prepare(`SELECT timestamp FROM vehicle_state ORDER BY timestamp DESC LIMIT 1`).first();
      const lastDrive = await db.prepare(`SELECT COALESCE(ended_at, started_at) AS ts FROM drives ORDER BY ts DESC LIMIT 1`).first();
      const lastCharge = await db.prepare(`SELECT COALESCE(ended_at, started_at) AS ts FROM charges ORDER BY ts DESC LIMIT 1`).first();
      const statesVisited = await db.prepare(`SELECT COUNT(DISTINCT start_state) as cnt FROM drives WHERE start_state IS NOT NULL`).first();
      const driveCount = await db.prepare(`SELECT COUNT(1) as cnt FROM drives`).first();
      const chargeCount = await db.prepare(`SELECT COUNT(1) as cnt FROM charges`).first();

      const nowMs = Date.now();
      function ageSec(ts?: string) { return ts ? Math.round((nowMs - new Date(ts).getTime()) / 1000) : null; }

      const vsTs = (lastVehicleState as any)?.timestamp as string | undefined;
      const driveTs = (lastDrive as any)?.ts as string | undefined;
      const chargeTs = (lastCharge as any)?.ts as string | undefined;

      const vehicleStateAge = ageSec(vsTs);
      const driveDataAge = ageSec(driveTs);
      const chargeDataAge = ageSec(chargeTs);

      health.ingestion = {
        vehicleState: { lastUpdate: vsTs || null, ageSeconds: vehicleStateAge },
        drives: { lastUpdate: driveTs || null, ageSeconds: driveDataAge, total: (driveCount as any)?.cnt || 0 },
        charges: { lastUpdate: chargeTs || null, ageSeconds: chargeDataAge, total: (chargeCount as any)?.cnt || 0 },
        statesVisited: (statesVisited as any)?.cnt || 0
      };

      // Freshness evaluation
      if (vehicleStateAge != null) {
        if (vehicleStateAge > 6 * 3600) { // >6h
          health.status = 'degraded';
          health.warnings.push('Vehicle state older than 6h');
        } else if (vehicleStateAge > 24 * 3600) {
          health.status = 'unhealthy';
          health.warnings.push('Vehicle state older than 24h');
        }
      } else {
        health.status = 'degraded';
        health.warnings.push('No vehicle state data');
      }
    } catch (e) {
      health.status = 'degraded';
      health.warnings.push('Failed to compute ingestion metrics');
    }
  }

  health.performance.responseTimeMs = Date.now() - start;
  return c.json(health, health.status === 'unhealthy' ? 503 : 200);
});

// Simple health endpoint
healthRouter.get('/simple', async (c) => {
  return c.json({
    status: 'ok',
    timestamp: Date.now(),
    service: 'A Whittle Wandering API'
  });
});