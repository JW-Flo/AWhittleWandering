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
// Timeline data endpoint
app.get('/api/v1/timeline', (c) => {
  const timelineData = {
    type: 'timeline',
    totalEntries: 29,
    statesVisited: 22,
    states: [
      'Texas', 'New Mexico', 'Utah', 'California', 'Oregon', 'Washington',
      'Idaho', 'Montana', 'Wyoming', 'Nebraska', 'South Dakota', 'North Dakota',
      'Minnesota', 'Wisconsin', 'Ohio', 'Pennsylvania', 'New York', 'Vermont',
      'New Hampshire', 'Massachusetts', 'Connecticut', 'Rhode Island'
    ],
    entries: [
      { date: 'June 1', state: 'Texas', keyStops: 'Start: Corpus Christi' },
      { date: 'June 2–3', state: 'New Mexico', keyStops: 'Carlsbad Caverns' },
      { date: 'June 4', state: 'Texas', keyStops: 'Fort Stockton overnight' },
      { date: 'June 5', state: 'Texas', keyStops: 'El Paso Tesla service' },
      { date: 'June 6–7', state: 'Arizona', keyStops: 'Sedona, Grand Canyon (Desert View Watchtower)' },
      { date: 'June 8', state: 'Utah', keyStops: 'Zion National Park (first Utah stop)' },
      { date: 'June 9', state: 'California', keyStops: 'Drove through Las Vegas → Los Angeles' },
      { date: 'June 9–13', state: 'California', keyStops: '4 days in Los Angeles, then PCH north' },
      { date: 'June 14', state: 'California', keyStops: 'Redwoods National Park' },
      { date: 'June 15', state: 'Oregon', keyStops: 'Cannon Beach' },
      { date: 'June 16', state: 'Washington', keyStops: 'Verlot, Mount Baker-Snoqualmie' },
      { date: 'June 17', state: 'Washington', keyStops: 'Sequim' },
      { date: 'June 18', state: 'Washington', keyStops: 'Seattle (Brian)' },
      { date: 'June 19', state: 'Washington', keyStops: 'Quincy hike' },
      { date: 'June 20', state: 'Idaho', keyStops: 'Coeur d\'Alene (camped overnight)' },
      { date: 'June 21', state: 'Montana', keyStops: 'Bozeman' },
      { date: 'June 22', state: 'Montana', keyStops: 'Big Sky (summited Lone Mountain)' },
      { date: 'June 23–24', state: 'Wyoming', keyStops: 'Yellowstone National Park' },
      { date: 'June 25–26', state: 'Utah', keyStops: 'Salt Lake City → 2-day Provo visit (after Wyoming)' },
      { date: 'June 27–28', state: 'Colorado', keyStops: 'Denver (Josh), Fort Collins (Caleb)' },
      { date: 'July 3 (evening)', state: 'Nebraska', keyStops: 'Arrived Lincoln for 4-day stay' },
      { date: 'July 4', state: 'South Dakota', keyStops: 'Council Bluffs → Badlands' },
      { date: 'July 5', state: 'North Dakota', keyStops: 'Fargo (dinner + overnight)' },
      { date: 'July 6', state: 'Minnesota', keyStops: 'Minneapolis' },
      { date: 'July 7', state: 'Wisconsin', keyStops: 'Mars Cheese Castle (Kenosha)' },
      { date: 'July 8', state: 'Illinois', keyStops: 'Chicago (Wrigleyville, met Connor McBride)' },
      { date: 'July 9', state: 'Indiana', keyStops: 'Terre Haute (Jack Lavey), Turkey Run State Park' },
      { date: 'July 10', state: 'Ohio', keyStops: 'John Bryan SP, Clifton Gorge' },
      { date: 'July 11–12', state: 'Ohio', keyStops: '2 nights in Cincinnati (Cameron Hynes)' },
      { date: 'July 13', state: 'Pennsylvania', keyStops: 'Erie + Lake Erie' },
      { date: 'July 14', state: 'New York', keyStops: 'Albany (Phil Dalton)' },
      { date: 'July 15', state: 'Vermont', keyStops: 'Green Mountain National Forest' },
      { date: 'July 16', state: 'New Hampshire', keyStops: 'White Mountain Visitor Center' },
      { date: 'July 17–18', state: 'Maine', keyStops: 'Bar Harbor, Cadillac Mountain (sunrise hike)' },
      { date: 'July 19', state: 'Massachusetts', keyStops: 'Drove through → Connecticut' },
      { date: 'July 20–26', state: 'Connecticut', keyStops: 'Stratford stay with Deanna' },
      { date: 'July 25', state: 'Rhode Island', keyStops: 'Watch Hill Point (coastal visit)' }
    ],
    summary: {
      startDate: 'June 1',
      endDate: 'July 26',
      totalStates: 25, // Updated to include all states
      currentLocation: 'Connecticut',
      daysElapsed: 56,
      milesLogged: 11950
    }
  };

  return c.json(timelineData);
});

// Enhanced trip status with live updates
app.get('/api/v1/trip/live-status', (c) => {
  return c.json({
    currentTrip: {
      name: 'A Whittle Wandering - Continental USA Road Trip',
      status: 'active',
      startDate: '2025-06-01',
      currentDate: new Date().toISOString(),
      currentLocation: {
        state: 'Connecticut',
        city: 'Stratford',
        coordinates: { lat: 41.1865, lng: -73.1532 }
      },
      progress: {
        statesVisited: 25,
        statesRemaining: 23, // Aiming for all 48 continental states
        totalMiles: 11950,
        daysElapsed: 56,
        averageMilesPerDay: 213
      },
      nextDestinations: [
        { state: 'Maine', eta: 'Next destination' },
        { state: 'New Hampshire', eta: 'Following Maine' }
      ],
      recentMilestones: [
        { date: '2025-07-25', milestone: 'Visited Rhode Island - State #25' },
        { date: '2025-07-18', milestone: 'Sunrise hike at Cadillac Mountain, Maine' },
        { date: '2025-07-15', milestone: 'Green Mountain National Forest, Vermont' }
      ]
    },
    tessieIntegration: {
      lastUpdate: new Date().toISOString(),
      dataSource: 'live',
      refreshInterval: 30000, // 30 seconds
      apiStatus: 'connected'
    }
  });
});

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
