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
app.get('/health', healthRouter.handlers['/simple'][0]); // Use simple health endpoint
app.get('/unified-data', async (c) => c.redirect('/api/v1/unified-data', 308));
app.get('/trip-status', async (c) => c.redirect('/api/v1/trip-status', 308));
app.get('/api/v1/config', tripStatusRouter.handlers['/config'][0]); // Use config from tripStatus

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

// Export for Cloudflare Workers
export default app;