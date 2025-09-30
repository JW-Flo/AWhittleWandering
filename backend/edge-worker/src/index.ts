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
  const userId = 'demo-' + Math.random().toString(36).slice(2, 10);
  const log = [
    { step: 'create_user', status: 'ok', userId, timestamp: now },
    { step: 'provision_stub', status: 'ok', userId, timestamp: now },
    { step: 'assign_role', status: 'ok', userId, role: 'joiner', timestamp: now },
    { step: 'done', status: 'success', userId, timestamp: now }
  ];
  return c.json({
    ok: true,
    userId,
    log
  });
});

// Export for Cloudflare Workers
export default app;