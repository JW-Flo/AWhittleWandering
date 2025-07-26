import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { z } from 'zod';

const app = new Hono();

// Enable CORS for frontend access
app.use('*', cors({
  origin: ['http://localhost:8080', 'https://awhittlewandering.pages.dev'],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: Date.now(),
    version: '1.0.0',
    service: 'A Whittle Wandering API',
    uptime: process.uptime?.() || 0
  });
});

// Tesla telemetry schema validation
const TeslaTelemetrySchema = z.object({
  timestamp: z.string().datetime(),
  battery: z.object({
    stateOfCharge: z.number().min(0).max(100),
    rangeRemaining: z.number().min(0),
    chargingState: z.enum(['Charging', 'Disconnected', 'Complete']),
    chargeRate: z.number().optional(),
    batteryTemp: z.number().optional()
  }),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    elevation: z.number().optional(),
    accuracy: z.number().optional()
  }),
  vehicle: z.object({
    speed: z.number().min(0),
    heading: z.number().min(0).max(360),
    odometer: z.number().min(0),
    softwareVersion: z.string().optional()
  })
});

// Submit Tesla telemetry data
app.post('/api/v1/telemetry', async (c) => {
  try {
    const body = await c.req.json();
    const validatedData = TeslaTelemetrySchema.parse(body);
    
    // Store telemetry data (implement your storage logic here)
    // For now, just return success
    
    return c.json({
      success: true,
      message: 'Telemetry data received',
      timestamp: Date.now(),
      dataPoints: 1
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Invalid telemetry data',
      details: error instanceof z.ZodError ? error.errors : 'Unknown error'
    }, 400);
  }
});

// Get current trip status
app.get('/api/v1/trip/status', (c) => {
  return c.json({
    tripId: 'awhittlewandering-2025',
    status: 'active',
    progress: {
      statesVisited: 17,
      totalStates: 48,
      completionPercentage: 35.4
    },
    currentLocation: {
      state: 'Connecticut',
      coordinates: {
        latitude: 41.205,
        longitude: -73.150
      },
      lastUpdate: '2025-07-26T00:34:05Z'
    },
    statistics: {
      startDate: '2025-06-03',
      daysElapsed: 53,
      totalMiles: 11950,
      averageMilesPerDay: 225,
      startOdometer: 58046,
      currentOdometer: 69996
    },
    nextDestinations: [
      'New Jersey',
      'Delaware', 
      'Maryland',
      'Virginia'
    ]
  });
});

// Legacy trip endpoint for compatibility
app.get('/api/v1/trip', (c) => {
  return c.json({ 
    trip: '48 Continental States Tesla Adventure',
    status: 'in-progress',
    vehicle: 'Tesla Model Y',
    currentState: 'Connecticut',
    statesVisited: 17,
    totalStates: 48,
    milesTracked: 11950,
    daysOnRoad: 53,
    nextDestination: 'New Jersey'
  });
});

// Get trip analytics 
app.get('/api/v1/trip/analytics', (c) => {
  return c.json({
    summary: {
      totalDistance: 11950,
      daysOnRoad: 53,
      statesExplored: 17,
      averageDailyDistance: 225,
      farthestPoint: 'Maine',
      efficiency: 'Excellent'
    },
    milestones: [
      {
        type: 'distance',
        achievement: '10,000 Miles',
        date: '2025-07-20',
        completed: true
      },
      {
        type: 'states',
        achievement: 'New England Complete', 
        date: '2025-06-16',
        completed: true
      },
      {
        type: 'duration',
        achievement: '50 Days Adventure',
        date: '2025-07-22',
        completed: true
      }
    ],
    regions: {
      'South': { states: 5, completed: true },
      'Northeast': { states: 9, completed: true },
      'Midwest': { states: 0, completed: false },
      'West': { states: 3, completed: false }
    }
  });
});

// API documentation endpoint
app.get('/api/docs', (c) => {
  return c.json({
    title: 'A Whittle Wandering API',
    description: '48 Continental US Tesla Road Trip Tracking API',
    version: '1.0.0',
    endpoints: {
      'GET /health': 'API health check',
      'POST /api/v1/telemetry': 'Submit Tesla vehicle telemetry',
      'GET /api/v1/trip/status': 'Get current trip status and progress',
      'GET /api/v1/trip/analytics': 'Get detailed trip analytics and milestones',
      'GET /api/docs': 'This documentation'
    },
    contact: {
      github: 'https://github.com/JW-Flo/AWhittleWandering',
      live_tracking: 'https://awhittlewandering.pages.dev'
    }
  });
});

// Catch-all route
app.all('*', (c) => {
  return c.json({
    error: 'Route not found',
    available_endpoints: [
      'GET /health',
      'POST /api/v1/telemetry',
      'GET /api/v1/trip/status',
      'GET /api/v1/trip/analytics', 
      'GET /api/docs'
    ]
  }, 404);
});

export default app;
