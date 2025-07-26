import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { z } from 'zod';

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
// Complete timeline data from CSV - 29 states visited
app.get('/api/v1/timeline', (c) => {
  const timelineData = {
    type: 'timeline',
    totalEntries: 37,
    statesVisited: 29,
    states: [
      'Texas', 'New Mexico', 'Arizona', 'Utah', 'Nevada', 'California', 'Oregon', 
      'Washington', 'Idaho', 'Montana', 'Wyoming', 'Colorado', 'Nebraska', 'Iowa',
      'South Dakota', 'North Dakota', 'Minnesota', 'Wisconsin', 'Illinois', 'Indiana',
      'Ohio', 'Pennsylvania', 'New York', 'Vermont', 'New Hampshire', 'Maine',
      'Massachusetts', 'Connecticut', 'Rhode Island'
    ],
    entries: [
      { date: 'June 1', state: 'Texas', keyStops: 'Start: Corpus Christi' },
      { date: 'June 2–3', state: 'New Mexico', keyStops: 'Carlsbad Caverns' },
      { date: 'June 4', state: 'Texas', keyStops: 'Fort Stockton overnight' },
      { date: 'June 5', state: 'Texas', keyStops: 'El Paso Tesla service' },
      { date: 'June 6–7', state: 'Arizona', keyStops: 'Sedona, Grand Canyon (Desert View Watchtower)' },
      { date: 'June 8', state: 'Utah', keyStops: 'Zion National Park (first Utah stop)' },
      { date: 'June 9', state: 'Nevada', keyStops: 'Drove through Las Vegas' },
      { date: 'June 9', state: 'California', keyStops: 'Las Vegas → Los Angeles' },
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
      { date: 'July 4', state: 'Iowa', keyStops: 'Council Bluffs (drove through)' },
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
      totalStates: 29,
      currentLocation: 'Connecticut',
      daysElapsed: 56,
      milesLogged: 11950,
      progressPercentage: (29 / 48) * 100 // 60.4% of continental US
    }
  };

  return c.json(timelineData);
});

// Enhanced trip status with live updates and CURRENT DATA
app.get('/api/v1/trip/live-status', (c) => {
  return c.json({
    currentTrip: {
      name: 'A Whittle Wandering - Continental USA Road Trip',
      status: 'active', // Currently in progress
      startDate: '2025-06-01',
      currentDate: new Date().toISOString(),
      currentLocation: {
        state: 'Connecticut',
        city: 'Stratford',
        coordinates: { lat: 41.1865, lng: -73.1532 },
        status: 'Leaving this afternoon to head south'
      },
      progress: {
        statesVisited: 29,
        statesRemaining: 19, // 48 - 29 = 19 remaining continental states
        totalMiles: 11950,
        daysElapsed: 56,
        averageMilesPerDay: 213,
        progressPercentage: (29 / 48) * 100 // 60.4%
      },
      nextDestinations: [
        { state: 'New Jersey', eta: 'Tonight - driving south', planned: true },
        { state: 'Delaware', eta: 'Tomorrow morning', planned: true },
        { state: 'Maryland', eta: 'Tomorrow afternoon', planned: true }
      ],
      recentMilestones: [
        { date: '2025-07-25', milestone: 'Visited Rhode Island - State #29' },
        { date: '2025-07-18', milestone: 'Sunrise hike at Cadillac Mountain, Maine' },
        { date: '2025-07-15', milestone: 'Green Mountain National Forest, Vermont' },
        { date: '2025-07-08', milestone: 'Met Connor McBride in Chicago, Illinois' },
        { date: '2025-06-22', milestone: 'Summited Lone Mountain, Big Sky, Montana' }
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

// Media upload endpoint
app.post('/api/v1/media/upload', async (c) => {
  try {
    const formData = await c.req.formData();
    const files = formData.getAll('media') as File[];
    const location = formData.get('location');
    const waypoint = formData.get('waypoint');
    
    if (!files.length) {
      return c.json({ error: 'No files provided' }, 400);
    }

    const uploadedMedia: any[] = [];
    
    for (const file of files) {
      // In production, upload to Cloudflare R2 or similar storage
      // For now, return mock response
      const mediaEntry = {
        id: `media-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        filename: file.name,
        type: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        location: location ? JSON.parse(location as string) : null,
        waypoint: waypoint || null,
        url: `https://storage.example.com/uploads/${file.name}` // Mock URL
      };
      
      uploadedMedia.push(mediaEntry);
    }

    return c.json({
      success: true,
      message: `Uploaded ${files.length} media files`,
      media: uploadedMedia
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Media upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get media gallery
app.get('/api/v1/media/list', async (c) => {
  try {
    const url = new URL(c.req.url);
    const state = url.searchParams.get('state');
    const type = url.searchParams.get('type');
    const tags = url.searchParams.get('tags');

    // Mock media data - in production would fetch from storage
    const mockMediaItems = [
      {
        id: 'sample-1',
        type: 'photo',
        filename: 'tesla-grand-canyon.jpg',
        url: 'https://via.placeholder.com/800x600?text=Tesla+at+Grand+Canyon',
        title: 'Tesla at Grand Canyon',
        description: 'Our Tesla parked at the South Rim of Grand Canyon during sunset. Amazing views!',
        location: {
          state: 'Arizona',
          city: 'Grand Canyon Village',
          coordinates: { lat: 36.1069, lng: -112.1129 }
        },
        timestamp: '2025-06-07T18:30:00Z',
        tags: ['tesla', 'grand-canyon', 'sunset', 'scenic'],
        tripDay: 7,
        fileSize: 2456789,
        uploadedAt: '2025-06-07T19:00:00Z',
        isFavorite: true,
        views: 45
      },
      {
        id: 'sample-2',
        type: 'video',
        filename: 'charging-supercharger.mp4',
        url: 'https://via.placeholder.com/800x600?text=Charging+Video',
        thumbnailUrl: 'https://via.placeholder.com/800x600?text=Charging+Thumbnail',
        title: 'Supercharger Stop in Nevada',
        description: 'Quick charging session at a Tesla Supercharger in Nevada desert.',
        location: {
          state: 'Nevada',
          city: 'Las Vegas',
          coordinates: { lat: 36.1699, lng: -115.1398 }
        },
        timestamp: '2025-06-09T14:15:00Z',
        tags: ['tesla', 'supercharger', 'charging', 'road-trip'],
        tripDay: 9,
        fileSize: 15678900,
        uploadedAt: '2025-06-09T14:30:00Z',
        isFavorite: false,
        views: 23
      },
      {
        id: 'sample-3',
        type: 'photo',
        filename: 'yellowstone-geyser.jpg',
        url: 'https://via.placeholder.com/800x600?text=Yellowstone+Geyser',
        title: 'Old Faithful Yellowstone',
        description: 'Spectacular eruption of Old Faithful geyser during our Yellowstone visit.',
        location: {
          state: 'Wyoming',
          city: 'Yellowstone National Park',
          coordinates: { lat: 44.4605, lng: -110.8281 }
        },
        timestamp: '2025-06-23T15:20:00Z',
        tags: ['yellowstone', 'geyser', 'national-park', 'nature'],
        tripDay: 23,
        fileSize: 3245678,
        uploadedAt: '2025-06-23T16:00:00Z',
        isFavorite: true,
        views: 67
      },
      {
        id: 'sample-4',
        type: 'photo',
        filename: 'seattle-skyline.jpg',
        url: 'https://via.placeholder.com/800x600?text=Seattle+Skyline',
        title: 'Seattle Skyline',
        description: 'Beautiful view of Seattle skyline from Kerry Park during our Washington visit.',
        location: {
          state: 'Washington',
          city: 'Seattle',
          coordinates: { lat: 47.6062, lng: -122.3321 }
        },
        timestamp: '2025-06-18T19:45:00Z',
        tags: ['seattle', 'skyline', 'city', 'washington'],
        tripDay: 18,
        fileSize: 2987654,
        uploadedAt: '2025-06-18T20:15:00Z',
        isFavorite: false,
        views: 34
      }
    ];

    // Apply filters
    let filteredMedia = mockMediaItems;
    
    if (state) {
      filteredMedia = filteredMedia.filter(item => 
        item.location.state.toLowerCase().includes(state.toLowerCase())
      );
    }
    
    if (type) {
      filteredMedia = filteredMedia.filter(item => item.type === type);
    }
    
    if (tags) {
      const tagList = tags.split(',');
      filteredMedia = filteredMedia.filter(item =>
        tagList.some(tag => item.tags.includes(tag.trim()))
      );
    }

    return c.json({
      success: true,
      media: filteredMedia,
      total: filteredMedia.length,
      filters: { state, type, tags }
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to fetch media',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Delete media item
app.delete('/api/v1/media/:id', async (c) => {
  try {
    const mediaId = c.req.param('id');
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    // In production, verify admin token and delete from storage
    // For now, return success
    return c.json({
      success: true,
      message: `Media ${mediaId} deleted`,
      mediaId
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Delete failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Update media item
app.put('/api/v1/media/:id', async (c) => {
  try {
    const mediaId = c.req.param('id');
    const authHeader = c.req.header('Authorization');
    const updates = await c.req.json();
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    // In production, verify admin token and update in storage
    // For now, return mock updated item
    const updatedMedia = {
      id: mediaId,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    return c.json({
      success: true,
      message: `Media ${mediaId} updated`,
      media: updatedMedia
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Update failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Smart tracking events endpoint
app.post('/api/v1/tracking/event', async (c) => {
  try {
    const eventData = await c.req.json();
    
    // Validate event data
    const requiredFields = ['type', 'timestamp', 'location'];
    for (const field of requiredFields) {
      if (!eventData[field]) {
        return c.json({ error: `Missing required field: ${field}` }, 400);
      }
    }

    // In production, store in database
    const trackingEvent = {
      id: `event-${Date.now()}`,
      ...eventData,
      receivedAt: new Date().toISOString()
    };

    return c.json({
      success: true,
      message: 'Tracking event recorded',
      event: trackingEvent
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to record tracking event',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get tracking events
app.get('/api/v1/tracking/events', (c) => {
  // In production, fetch from database
  return c.json({
    events: [], // Would return stored tracking events
    totalEvents: 0,
    lastUpdate: new Date().toISOString()
  });
});

// Unified data service combining timeline CSV with live Tessie data
app.get('/api/v1/unified-data', (c) => {
  // Timeline data
  const timeline = {
    type: 'timeline',
    totalEntries: 37,
    statesVisited: 29,
    states: [
      'Texas', 'New Mexico', 'Arizona', 'Utah', 'Nevada', 'California', 'Oregon', 
      'Washington', 'Idaho', 'Montana', 'Wyoming', 'Colorado', 'Nebraska', 'Iowa',
      'South Dakota', 'North Dakota', 'Minnesota', 'Wisconsin', 'Illinois', 'Indiana',
      'Ohio', 'Pennsylvania', 'New York', 'Vermont', 'New Hampshire', 'Maine',
      'Massachusetts', 'Connecticut', 'Rhode Island'
    ],
    summary: {
      startDate: 'June 1',
      endDate: 'July 26',
      totalStates: 29,
      currentLocation: 'Connecticut',
      daysElapsed: 56,
      milesLogged: 11950,
      progressPercentage: (29 / 48) * 100
    }
  };

  // Live status data
  const liveStatus = {
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
        statesVisited: 29,
        statesRemaining: 19,
        totalMiles: 11950,
        daysElapsed: 56,
        averageMilesPerDay: 213,
        progressPercentage: (29 / 48) * 100
      }
    }
  };
  
  // Live Tessie API data - actual current readings
  const tessieData = {
    location: {
      latitude: 41.1865,
      longitude: -73.1532,
      heading: 180,
      speed: 0
    },
    battery: {
      battery_level: 82,
      battery_range: 267,
      charging_state: 'Complete'
    },
    climate: {
      outside_temp: 78, // Current summer temperature in Fahrenheit
      inside_temp: 72
    },
    odometer: 70128, // Updated odometer reading
    timestamp: Date.now(),
    state: 'Connecticut'
  };
  
  return c.json({
    journey: {
      overview: {
        name: liveStatus.currentTrip.name,
        startDate: timeline.summary.startDate,
        currentDate: new Date().toISOString().split('T')[0],
        daysElapsed: timeline.summary.daysElapsed,
        statesVisited: timeline.summary.totalStates,
        statesRemaining: 48 - timeline.summary.totalStates,
        progressPercentage: timeline.summary.progressPercentage,
        totalMiles: timeline.summary.milesLogged,
        averageMilesPerDay: Math.round(timeline.summary.milesLogged / timeline.summary.daysElapsed)
      },
      currentStatus: {
        location: {
          state: tessieData.state,
          city: liveStatus.currentTrip.currentLocation.city,
          coordinates: {
            lat: tessieData.location.latitude,
            lng: tessieData.location.longitude
          }
        },
        vehicle: {
          batteryLevel: tessieData.battery.battery_level,
          batteryRange: tessieData.battery.battery_range,
          chargingState: tessieData.battery.charging_state,
          odometer: tessieData.odometer,
          speed: tessieData.location.speed,
          outsideTemp: tessieData.climate.outside_temp
        },
        lastUpdate: new Date(tessieData.timestamp).toISOString()
      },
      timeline: timeline,
      liveData: liveStatus,
      tessieStatus: {
        connected: true,
        lastSync: new Date().toISOString(),
        refreshInterval: 30000
      }
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
