import { Hono } from 'hono';
import type { Env } from '../types/env';
import { logger } from '../utils/log';

// Latency snapshot accessor injected via index.ts (module augmentation pattern avoided for simplicity)
// We attempt dynamic access from globalThis where we may attach metrics if needed; fallback noop.
function getLatencySnapshot(): { count: number; p50: number; p95: number } | null {
  try {
    // @ts-ignore
    if (globalThis.__LAT_SNAPSHOT__) return globalThis.__LAT_SNAPSHOT__();
  } catch {}
  return null;
}

export const healthRouter = new Hono<{ Bindings: Env }>();

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

  // D1 connectivity check (SELECT 1)
  if (db) {
    try {
      await db.prepare('SELECT 1').first();
      health.resources.d1_database = 'operational';
    } catch (e) {
      health.resources.d1_database = 'error';
      health.status = 'degraded';
      const errorMsg = e instanceof Error ? e.message : String(e);
      health.warnings.push(`D1 database not reachable: ${errorMsg.substring(0, 100)}`);
      logger.error('D1 database error', { error: e instanceof Error ? e.message : String(e) });
    }
  } else {
    health.warnings.push('D1 database not configured');
  }

  // R2 storage — classified as optional when not configured
  if (c.env?.MEDIA_BUCKET) {
    try {
      await c.env.MEDIA_BUCKET.list({ limit: 1 });
      health.resources.r2_storage = 'operational';
    } catch (e) {
      health.resources.r2_storage = 'error';
      health.status = 'degraded';
      const errorMsg = e instanceof Error ? e.message : String(e);
      health.warnings.push(`R2 storage not reachable: ${errorMsg.substring(0, 100)}`);
      logger.error('R2 storage error', { error: e instanceof Error ? e.message : String(e) });
    }
  } else {
    // R2 is optional — media uploads are disabled but the platform functions without it
    health.resources.r2_storage = 'not_configured (optional — media uploads disabled)';
  }

  // Ingestion / data freshness metrics
  if (db && health.resources.d1_database === 'operational') {
    try {
      const nowMs = Date.now();
      function ageSec(ts?: string) { return ts ? Math.round((nowMs - new Date(ts).getTime()) / 1000) : null; }

      // Wrap each query in its own try/catch to handle missing tables gracefully
      let vsTs: string | undefined;
      let driveTs: string | undefined;
      let chargeTs: string | undefined;
      let driveCnt = 0;
      let chargeCnt = 0;
      let statesCnt = 0;

      try {
        const lastVehicleState = await db.prepare(`SELECT timestamp FROM vehicle_state ORDER BY timestamp DESC LIMIT 1`).first();
        vsTs = (lastVehicleState as any)?.timestamp as string | undefined;
      } catch {
        // vehicle_state table may not exist or be empty — not an error
      }

      try {
        const lastDrive = await db.prepare(`SELECT COALESCE(ended_at, started_at) AS ts FROM drives ORDER BY ts DESC LIMIT 1`).first();
        driveTs = (lastDrive as any)?.ts as string | undefined;
      } catch {
        // drives table may not exist or be empty
      }

      try {
        const lastCharge = await db.prepare(`SELECT COALESCE(ended_at, started_at) AS ts FROM charges ORDER BY ts DESC LIMIT 1`).first();
        chargeTs = (lastCharge as any)?.ts as string | undefined;
      } catch {
        // charges table may not exist or be empty
      }

      try {
        const statesVisited = await db.prepare(`SELECT COUNT(DISTINCT start_state) as cnt FROM drives WHERE start_state IS NOT NULL`).first();
        statesCnt = (statesVisited as any)?.cnt || 0;
      } catch {
        // Graceful fallback
      }

      try {
        const driveCount = await db.prepare(`SELECT COUNT(1) as cnt FROM drives`).first();
        driveCnt = (driveCount as any)?.cnt || 0;
      } catch {
        // Graceful fallback
      }

      try {
        const chargeCount = await db.prepare(`SELECT COUNT(1) as cnt FROM charges`).first();
        chargeCnt = (chargeCount as any)?.cnt || 0;
      } catch {
        // Graceful fallback
      }

      const vehicleStateAge = ageSec(vsTs);
      const driveDataAge = ageSec(driveTs);
      const chargeDataAge = ageSec(chargeTs);

      health.ingestion = {
        vehicleState: { lastUpdate: vsTs || null, ageSeconds: vehicleStateAge },
        drives: { lastUpdate: driveTs || null, ageSeconds: driveDataAge, total: driveCnt },
        charges: { lastUpdate: chargeTs || null, ageSeconds: chargeDataAge, total: chargeCnt },
        statesVisited: statesCnt
      };

      // Freshness evaluation — only warn if data exists but is stale
      if (vehicleStateAge != null) {
        if (vehicleStateAge > 24 * 3600) {
          health.status = 'unhealthy';
          health.warnings.push('Vehicle state older than 24h');
        } else if (vehicleStateAge > 6 * 3600) {
          health.status = 'degraded';
          health.warnings.push('Vehicle state older than 6h');
        }
      } else if (driveCnt === 0 && chargeCnt === 0) {
        // No ingestion data at all — informational, not degraded
        health.ingestion.note = 'No ingestion data yet';
      } else {
        health.status = 'degraded';
        health.warnings.push('No vehicle state data');
      }
    } catch (e) {
      // Top-level fallback — should not be reached given per-query guards above
      health.ingestion = { note: 'Unable to compute ingestion metrics' };
      logger.error('Ingestion metrics error', { error: e instanceof Error ? e.message : String(e) });
    }
  }

  health.performance.responseTimeMs = Date.now() - start;
  const lat = getLatencySnapshot();
  if (lat) {
    health.performance.latency = lat; // Append-only: does not remove existing keys
  }
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
