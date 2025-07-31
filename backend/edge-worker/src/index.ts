import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

// Enable CORS for frontend access
app.use('*', cors({
  origin: [
    'http://localhost:8080', 
    'http://localhost:8081', 
    'http://localhost:8082', 
    'http://localhost:8083', 
    'https://awhittlewandering.com',
    'https://www.awhittlewandering.com',
    'https://awhittlewandering.pages.dev',
    'https://1cf342fa.awhittlewandering.pages.dev'
  ],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: Date.now(),
    version: '1.0.0',
    service: 'A Whittle Wandering API'
  });
});

// Get trip status
app.get('/api/v1/trip/status', (c) => {
  return c.json({
    tripId: 'awhittlewandering-2025',
    status: 'active',
    progress: {
      statesVisited: 29,
      totalStates: 48,
      completionPercentage: (29 / 48) * 100
    },
    currentLocation: {
      state: 'Connecticut',
      coordinates: {
        latitude: 41.205,
        longitude: -73.150
      },
      lastUpdate: new Date().toISOString()
    },
    statistics: {
      startDate: '2025-06-01',
      daysElapsed: 56,
      totalMiles: 11950,
      averageMilesPerDay: 213
    }
  });
});

// Legacy trip endpoint 
app.get('/api/v1/trip', (c) => {
  return c.json({ 
    trip: '48 Continental States Tesla Adventure',
    status: 'in-progress',
    vehicle: 'Tesla Model Y',
    currentState: 'Connecticut',
    statesVisited: 29,
    totalStates: 48,
    milesTracked: 11950,
    daysOnRoad: 56,
    nextDestination: 'New Jersey'
  });
});

// API documentation
app.get('/api/docs', (c) => {
  return c.json({
    title: 'A Whittle Wandering API',
    description: '48 Continental US Tesla Road Trip Tracking API',
    version: '1.0.0',
    endpoints: {
      'GET /health': 'API health check',
      'GET /api/v1/trip/status': 'Get current trip status and progress',
      'GET /api/v1/trip': 'Legacy trip endpoint',
      'GET /api/docs': 'This documentation'
    }
  });
});

// Catch-all route
app.all('*', (c) => {
  return c.json({
    error: 'Route not found',
    available_endpoints: [
      'GET /health',
      'GET /api/v1/trip/status',
      'GET /api/v1/trip',
      'GET /api/docs'
    ]
  }, 404);
});

export default app;
