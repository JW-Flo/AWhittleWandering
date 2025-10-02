import { Hono } from 'hono';
import { z } from 'zod';

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

// Latency measuring middleware (placed after error/rate/security so it measures full chain)
app.use('*', async (c, next) => {
  const start = performance.now();
  await next();
  const ms = Math.round(performance.now() - start);
  recordLatency(ms);
  // Expose latest latency snapshot via execution context for health router (optional future use)
  (c as any).executionCtx?.waitUntil?.(Promise.resolve());
});

// Simple bearer/JWT-like admin auth middleware (non-invasive; only enforces if JWT_SECRET configured)
const adminAuth = async (c: any, next: any) => {
  const secret = c.env?.JWT_SECRET;
  if (!secret) return next(); // No secret configured; skip enforcement
  const authz = c.req.header('Authorization') || '';
  if (!authz.startsWith('Bearer ')) {
    return c.json({ ok: false, error: 'Missing bearer token' }, 401);
  }
  const token = authz.slice(7).trim();
  // Extremely lightweight token check: token must equal secret or secret prefixed hash
  if (token !== secret) {
    return c.json({ ok: false, error: 'Invalid token' }, 403);
  }
  await next();
};

// Mount routers (admin protected)
app.route('/api/v1/health', healthRouter);
app.route('/api/v1/telemetry', telemetryRouter);
app.route('/api/v1/unified-data', unifiedDataRouter);
app.route('/api/v1/trip-status', tripStatusRouter);
app.use('/api/v1/admin/*', adminAuth);
app.route('/api/v1/admin', adminRouter);

// Legacy and convenience routes
// Provide a simple health endpoint directly
app.get('/health', async (c) => c.json({ ok: true, status: 'healthy', timestamp: new Date().toISOString() }));
app.get('/unified-data', async (c) => c.redirect('/api/v1/unified-data', 308));
app.get('/trip-status', async (c) => c.redirect('/api/v1/trip-status', 308));
// Provide a config endpoint directly for demo
app.get('/api/v1/config', async (c) => c.json({
  appName: 'Tesla Road Trip Tracker',
  apiVersion: '3.0.0',
  features: {
    liveTeslaData: true,
    mapIntegration: false,
    realtimeUpdates: true
  },
  updateInterval: 30000,
  mapboxToken: null,
  apiBaseUrl: '',
}));
// Optional: minimal connectors endpoint for demo (moved after app declaration)
app.get('/api/connectors', async (c) => {
  return c.json({
    connectors: [
      { id: 'okta', name: 'Okta', status: 'stubbed' },
      { id: 'azuread', name: 'Azure AD', status: 'stubbed' },
      { id: 'google', name: 'Google Workspace', status: 'stubbed' }
    ]
  });
});

// Root endpoint
app.get('/', async (c) => {
  return c.json({
    service: 'A Whittle Wandering - Tesla Road Trip Tracker',
    version: '3.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/v1/health',
      telemetry: '/api/v1/telemetry',
      unifiedData: '/api/v1/unified-data',
      tripStatus: '/api/v1/trip-status',
      admin: '/api/v1/admin',
      config: '/api/v1/config'
    },
    legacy: {
      '/health': 'Redirects to simple health check',
      '/unified-data': 'Redirects to /api/v1/unified-data',
      '/trip-status': 'Redirects to /api/v1/trip-status'
    }
  });
});

// Minimal demo joiner endpoint
app.post('/api/joiner', async (c) => {
  // Simulate joiner flow: create user, stub provision, assign role, return log
  const now = new Date().toISOString();
  // Use Web Crypto for secure unique id; fall back to timestamp if unavailable
  let userId: string;
  try {
    // crypto.randomUUID is supported in Cloudflare Workers runtime
    userId = 'demo-' + crypto.randomUUID();
  } catch {
    // Fallback (should rarely execute) – still unique enough for demo
    userId = 'demo-fallback-' + Date.now().toString(36);
  }
  const log = [
    { step: 'create_user', status: 'ok', userId, timestamp: now },
    { step: 'provision_stub', status: 'ok', userId, timestamp: now },
    { step: 'assign_role', status: 'ok', userId, role: 'joiner', timestamp: now },
    { step: 'done', status: 'success', userId, timestamp: now }
  ];
  return c.json({ ok: true, userId, log });
});

// Unified auth action endpoint replacing legacy /drop path
const authBodySchema = z.object({
  action: z.enum(['login', 'register']),
  username: z.string().min(3).optional(),
  password: z.string().min(6).optional()
});
app.post('/api/v1/auth', async (c) => {
  let parsed;
  try {
    const json = await c.req.json();
    const result = authBodySchema.safeParse(json);
    if (!result.success) {
      return c.json({ ok: false, error: 'Validation failed', issues: result.error.issues }, 400);
    }
    parsed = result.data;
  } catch {
    return c.json({ ok: false, error: 'Malformed JSON body' }, 400);
  }
  const { action } = parsed;
  return c.json({ ok: true, action, message: `${action} successful (demo)` });
});

// Backward-compatible legacy endpoint /drop (to be removed) – delegates to new handler
app.post('/drop', async (c) => {
  // Emit deprecation header so clients can migrate
  c.header('Deprecation', 'true');
  c.header('Link', '</api/v1/auth>; rel="successor-version"');
  // Reuse logic by crafting request body
  try {
    const body = await c.req.json();
    // Proxy to /api/v1/auth by performing an internal fetch using app.fetch not available here; just replicate minimal logic
    const action = body?.action;
    if (!action || !['login', 'register'].includes(action)) {
      return c.json({ ok: false, error: 'Invalid action. Use login or register.' }, 400);
    }
    return c.json({ ok: true, action, message: `${action} successful (legacy /drop – migrate to /api/v1/auth)` });
  } catch {
    return c.json({ ok: false, error: 'Malformed JSON body' }, 400);
  }
});

// Export for Cloudflare Workers
export default app;