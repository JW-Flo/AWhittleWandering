import { Hono, type Context, type Next } from 'hono';
import { z } from 'zod';
import { buildJobs } from './jobs';
import { recordRun } from './utils/cronMetrics';
import { logger } from './utils/log';
import type { Env } from './types/env';

// Middleware
import { corsMiddleware, securityHeaders } from './middleware/cors';
import { requestLogger, analyticsLogger } from './middleware/requestLogger';
import { rateLimit } from './middleware/rateLimit';
import { errorHandler } from './middleware/errorHandler';

// Routers
import { healthRouter } from './routers/health';
import { telemetryRouter } from './routers/telemetry';
import { unifiedDataRouter } from './routers/unifiedData';
import { tripStatusRouter } from './routers/tripStatus';
import { adminRouter } from './routers/admin';
import { componentRouter } from './routers/component';
import { analyticsRouter } from './routers/analytics';
import { vehicleRouter } from './routers/vehicle';
import { aiRouter } from './routers/ai';
import { metaRouter } from './routers/meta';
import { journeysRouter } from './routers/journeys';
import { placesRouter } from './routers/places';
import { verifyJwtHS256 } from './utils/jwtHs256';
import { authRouter } from './routers/auth';
import { mfaRouter } from './routers/mfa';
import { pushRouter } from './routers/push';
import { notificationsRouter } from './routers/notifications';
import { mediaRouter } from './routers/media';
import { importRouter } from './routers/import';

// Augment Env typing (local) for new PLATFORM_MODE variable
declare global {
  interface Env { PLATFORM_MODE?: string }
}

// Create the main Hono app
const app = new Hono<{ Bindings: Env }>();

// Global middleware
app.use('*', corsMiddleware);
app.use('*', securityHeaders);
app.use('*', requestLogger);
app.use('*', analyticsLogger);
app.use('*', rateLimit);
app.use('*', errorHandler);

// In-memory latency ring buffer (lightweight; resets on deploy)
const LAT_SAMPLES_MAX = 200;
const latencySamples: number[] = [];
function recordLatency(ms: number) {
  latencySamples.push(ms);
  if (latencySamples.length > LAT_SAMPLES_MAX) latencySamples.shift();
}
function snapshotLatency() {
  if (!latencySamples.length) return { count: 0, p50: 0, p95: 0 };
  const sorted = [...latencySamples].sort((a,b)=>a-b);
  const p = (q: number) => sorted[Math.min(sorted.length-1, Math.floor(q * sorted.length))];
  return { count: sorted.length, p50: p(0.5), p95: p(0.95) };
}

// Expose to health router (best-effort; safe if overwritten)
try {
  // @ts-ignore
  (globalThis as any).__LAT_SNAPSHOT__ = snapshotLatency;
} catch { /* noop */ }

// Latency measuring middleware (placed after error/rate/security so it measures full chain)
app.use('*', async (c, next) => {
  const start = performance.now();
  await next();
  const ms = Math.round(performance.now() - start);
  recordLatency(ms);
  // Expose latest latency snapshot via execution context for health router (optional future use)
  (c as any).executionCtx?.waitUntil?.(Promise.resolve());
});

// Admin auth middleware (non-invasive; only enforces if ADMIN_TOKEN configured)
const adminAuth = async (c: Context<{ Bindings: Env }>, next: Next) => {
  const secret = String(c.env?.ADMIN_TOKEN || '').trim();
  const prev = String(c.env?.ADMIN_TOKEN_PREVIOUS || '').trim();
  const jwtCur = String(c.env?.JWT_SECRET || '').trim();
  const jwtPrev = String(c.env?.JWT_SECRET_PREVIOUS || '').trim();

  // If nothing is configured, fail closed. Dev bypass requires explicit ENVIRONMENT=development.
  if (!secret && !prev && !jwtCur && !jwtPrev) {
    const env = String(c.env?.ENVIRONMENT || '');
    if (env === 'development') return next();
    return c.json({ ok: false, error: 'Admin auth not configured' }, 503);
  }

  const authz = c.req.header('Authorization') || '';
  if (!authz.startsWith('Bearer ')) {
    return c.json({ ok: false, error: 'Missing bearer token' }, 401);
  }
  const token = authz.slice(7).trim();

  // 1) Static token auth (rolling)
  if ((secret && token === secret) || (prev && token === prev)) {
    await next();
    return;
  }

  // 2) JWT admin auth (rolling secrets): accept HS256 token signed by JWT_SECRET or JWT_SECRET_PREVIOUS
  const jwtSecrets = [jwtCur, jwtPrev].filter(Boolean);
  if (jwtSecrets.length) {
    const verified = await verifyJwtHS256(token, jwtSecrets);
    if (verified.ok) {
      const p = verified.payload as Record<string, unknown>;
      const isAdmin =
        p?.admin === true ||
        p?.role === 'admin' ||
        (typeof p?.scope === 'string' && p.scope.split(/\s+/).includes('admin'));
      if (isAdmin) {
        await next();
        return;
      }
    }
  }

  return c.json({ ok: false, error: 'Invalid token' }, 403);
};

// Mount routers (admin protected)
app.route('/api/v1/health', healthRouter);
app.route('/api/v1/telemetry', telemetryRouter);
app.route('/api/v1/unified-data', unifiedDataRouter);
app.route('/api/v1/trip-status', tripStatusRouter);
app.route('/api/v1/component', componentRouter);
app.route('/api/v1/analytics', analyticsRouter);
app.route('/api/v1/vehicle', vehicleRouter);
app.route('/api/v1', aiRouter); // /route/* and /journal/*
app.route('/api/v1/meta', metaRouter);
app.route('/api/v1/journeys', journeysRouter); // Multi-tenant journey management
app.route('/api/v1/places', placesRouter); // Dynamic place detection + activity inference
app.route('/api/v1/auth', authRouter);
app.route('/api/v1/mfa', mfaRouter);
app.route('/api/v1/push', pushRouter);
app.route('/api/v1/notifications', notificationsRouter);
app.route('/api/v1/media', mediaRouter);
app.use('/api/v1/admin/*', adminAuth);
app.route('/api/v1/admin', adminRouter);
app.use('/api/v1/import/*', adminAuth);
app.route('/api/v1/import', importRouter);

// Legacy and convenience routes (permanent redirects for backward compatibility)
// Provide a simple health endpoint directly
app.get('/health', async (c) => c.json({ ok: true, status: 'healthy', timestamp: new Date().toISOString() }));
app.get('/unified-data', async (c) => c.redirect('/api/v1/unified-data', 301));
app.get('/trip-status', async (c) => c.redirect('/api/v1/trip-status', 301));
// Frontend expects this path (older config)
app.get('/api/v1/trip/status', async (c) => c.redirect('/api/v1/trip-status', 301));
// Provide a config endpoint for frontend bootstrap.
// SECURITY: Only expose public tokens (pk.*). Never expose secret tokens (sk.*).
app.get('/api/v1/config', async (c) => {
  const mode = c.env?.PLATFORM_MODE || 'live';
  const url = new URL(c.req.url);
  const apiBaseUrl = `${url.protocol}//${url.host}`;

  // Prefer dedicated MAPBOX_PUBLIC_TOKEN; fall back to MAPBOX_API_TOKEN only if it's a public key.
  const publicToken = c.env?.MAPBOX_PUBLIC_TOKEN || null;
  const apiToken = c.env?.MAPBOX_API_TOKEN || null;
  const safeToken = publicToken ?? (apiToken && !apiToken.startsWith('sk.') ? apiToken : null);

  return c.json({
    appName: 'A Whittle Wandering',
    apiVersion: '3.0.0',
    mode,
    apiBaseUrl,
    mapboxToken: safeToken,
    mapboxAccessToken: safeToken,
    features: {
      liveTeslaData: !!c.env?.TESSIE_API_TOKEN,
      mapIntegration: !!safeToken,
      realtimeUpdates: true
    },
    updateInterval: mode === 'live' ? 30000 : 45000
  });
});
// Root endpoint (minimal — avoid information disclosure)
app.get('/', async (c) => {
  return c.json({
    service: 'A Whittle Wandering',
    version: '3.0.0',
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Legacy endpoint /drop: proxies to /api/v1/auth for backward compatibility
app.post('/drop', async (c) => {
  // Forward original request to auth router
  try {
    const authUrl = new URL(c.req.url);
    authUrl.pathname = '/api/v1/auth';
    // Clone the original request to preserve body and headers
    const authReq = new Request(authUrl.toString(), {
      method: 'POST',
      headers: c.req.raw.headers,
      body: c.req.raw.body,
    });
    // Forward to the auth endpoint
    return await app.fetch(authReq, c.env, c.executionCtx);
  } catch (e: any) {
    return c.json({ ok: false, error: 'Invalid request', message: String(e?.message || e) }, 400);
  }
});

// Export for Cloudflare Workers
export default app;

// Cron handler (required by wrangler [triggers].crons). Performs lightweight housekeeping.
export const scheduled: ExportedHandlerScheduledHandler = async (event, env, ctx) => {
  // Consolidated cron strategy (2 triggers to stay within free-tier limit of 5/account):
  // 1) Every 30 minutes → full_sync (vehicle state + drives + charges)
  // 2) Every 6 hours at minute 10 → ai_data_processing + data_quality_check
  //
  // Removed triggers:
  //   - historical_backfill: use POST /api/v1/admin/backfill instead
  //   - data_quality_check (hourly): folded into the 6-hour ai_data_processing job
  const cron = event.cron;
  const jobs = buildJobs(env);

  const mapping: Record<string, { name: keyof ReturnType<typeof buildJobs>; description: string }[]> = {
    '*/30 * * * *': [ { name: 'full_sync', description: 'Comprehensive data sync' } ],
    '10 */6 * * *': [
      { name: 'data_quality_check', description: 'Data quality validation' },
      { name: 'ai_data_processing', description: 'AI/ML aggregation processing' }
    ]
  };

  const selected = mapping[cron];
  if (!selected) {
    logger.debug('Cron noop', { cron });
    return;
  }
  logger.info('Cron start', { cron, jobCount: selected.length });
  ctx.waitUntil((async () => {
    try {
      for (const item of selected) {
        await recordRun(env, cron, item.name, async () => {
          await jobs[item.name]();
        });
      }
      logger.info('Cron end', { cron });
    } catch (err) {
      logger.error('Cron job failed', { cron, err });
    }
  })());
};