import { Hono } from 'hono';

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

// Mount routers
app.route('/api/v1/health', healthRouter);
app.route('/api/v1/telemetry', telemetryRouter);
app.route('/api/v1/unified-data', unifiedDataRouter);
app.route('/api/v1/trip-status', tripStatusRouter);
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
app.post('/api/v1/auth', async (c) => {
  const { action } = await c.req.json<{ action?: string }>().catch(() => ({ action: undefined }));
  if (!action || !['login', 'register'].includes(action)) {
    return c.json({ ok: false, error: 'Invalid action. Use login or register.' }, 400);
  }
  // For now just echo success. Real implementation would verify credentials / create account.
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