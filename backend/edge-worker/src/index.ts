import { Hono } from 'hono';
import { cors } from 'hono/cors';

// Cloudflare Worker types for comprehensive resource integration
interface D1Database {
  prepare(query: string): D1PreparedStatement;
  exec(query: string): Promise<D1ExecResult>;
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
}

interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = any>(colName?: string): Promise<T | null>;
  run(): Promise<D1Result>;
  all<T = any>(): Promise<D1Result<T>>;
}

interface D1Result<T = any> {
  results?: T[];
  success: boolean;
  error?: string;
  meta: {
    duration: number;
    size_after: number;
    rows_read: number;
    rows_written: number;
  };
}

interface D1ExecResult {
  count: number;
  duration: number;
}

interface R2Bucket {
  get(key: string): Promise<R2Object | null>;
  put(key: string, value: ReadableStream | ArrayBuffer | string, options?: {
    httpMetadata?: {
      contentType?: string;
      cacheControl?: string;
    };
    customMetadata?: Record<string, string>;
  }): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; limit?: number }): Promise<R2Objects>;
}

interface R2Object {
  body: ReadableStream;
  httpMetadata: {
    contentType?: string;
    cacheControl?: string;
  };
  customMetadata: Record<string, string>;
  size: number;
  etag: string;
  uploaded: Date;
}

interface R2Objects {
  objects: R2Object[];
  truncated: boolean;
  cursor?: string;
}

interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

interface AnalyticsEngine {
  writeDataPoint(data: {
    blobs?: string[];
    doubles?: number[];
    indexes?: string[];
  }): void;
}

interface Queue {
  send(message: any, options?: { delaySeconds?: number }): Promise<void>;
  sendBatch(messages: any[]): Promise<void>;
}

interface Env {
  TESLA_DB: D1Database;
  MEDIA_BUCKET: R2Bucket;
  AUTH_TOKENS: KVNamespace;
  TELEMETRY_ANALYTICS: AnalyticsEngine;
  DATA_PROCESSOR: Queue;
  TESSIE_API_KEY: string;
  OPENWEATHER_API_KEY: string;
  JWT_SECRET: string;
  ADMIN_PASSWORD: string;
}

const app = new Hono<{ Bindings: Env }>();

// CORS configuration for all Cloudflare resources
app.use('*', cors({
  origin: [
    'http://localhost:8080', 
    'http://localhost:8081',
    'https://awhittlewandering.com',
    'https://www.awhittlewandering.com',
    'https://awhittlewandering.pages.dev',
    'https://*.awhittlewandering.pages.dev'
  ],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Client-ID'],
}));

// Analytics middleware - track all API usage
app.use('*', async (c, next) => {
  const start = Date.now();
  const ip = c.req.header('CF-Connecting-IP') || 'unknown';
  const userAgent = c.req.header('User-Agent') || 'unknown';
  
  await next();
  
  const duration = Date.now() - start;
  
  // Write to Analytics Engine for real-time monitoring
  try {
    c.env.TELEMETRY_ANALYTICS.writeDataPoint({
      blobs: [
        c.req.method,
        c.req.url,
        ip,
        userAgent.substring(0, 100),
        c.res.status.toString()
      ],
      doubles: [duration, c.res.status],
      indexes: [c.req.method, c.res.status.toString()]
    });
  } catch (error) {
    console.error('Analytics write failed:', error);
  }
  
  // Also log to D1 for detailed analytics
  try {
    await c.env.TESLA_DB.prepare(`
      INSERT INTO analytics_events 
      (event_type, event_data, user_ip, user_agent, processing_time_ms, status_code)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      'api_call',
      JSON.stringify({
        method: c.req.method,
        path: new URL(c.req.url).pathname,
        query: new URL(c.req.url).search
      }),
      ip,
      userAgent,
      duration,
      c.res.status
    ).run();
  } catch (error) {
    console.error('Failed to log analytics:', error);
  }
});

// Health check with comprehensive status
app.get('/api/v1/health', async (c) => {
  const health = {
    status: 'ok',
    timestamp: Date.now(),
    version: '3.0.0',
    service: 'A Whittle Wandering - Unified Cloudflare Stack',
    resources: {
      d1_database: 'connected',
      r2_storage: 'connected',
      analytics_engine: 'connected',
      queue_system: 'connected'
    }
  };

  try {
    // Test D1 connection
    await c.env.TESLA_DB.prepare('SELECT 1').first();
    health.resources.d1_database = 'operational';
  } catch (error) {
    health.status = 'degraded';
    health.resources.d1_database = 'error';
  }

  try {
    // Test R2 connection  
    await c.env.MEDIA_BUCKET.list({ limit: 1 });
    health.resources.r2_storage = 'operational';
  } catch (error) {
    health.resources.r2_storage = 'error';
  }

  return c.json(health);
});

// Main unified data endpoint using D1 for aggregation
app.get('/api/v1/unified-data', async (c) => {
  try {
    const cacheKey = 'unified_data_latest';
    
    // Check D1 cache first (much faster than KV for structured queries)
    const cached = await c.env.TESLA_DB.prepare(`
      SELECT cache_data, expires_at 
      FROM api_cache 
      WHERE cache_key = ? AND expires_at > datetime('now')
    `).bind(cacheKey).first();

    if (cached) {
      console.log('🎯 Returning D1 cached unified data');
      return c.json(JSON.parse(cached.cache_data as string));
    }

    console.log('🔄 Fetching fresh data from Tessie API and aggregating in D1...');

    // Fetch fresh data from Tessie API
    const tessieData = await fetchTessieData(c.env.TESSIE_API_KEY);
    
    // Process and store in D1 using transactions for consistency
    const unifiedData = await processAndStoreInD1(c.env.TESLA_DB, tessieData);
    
    // Cache the aggregated result in D1
    await c.env.TESLA_DB.prepare(`
      INSERT OR REPLACE INTO api_cache (cache_key, cache_data, expires_at, cache_type)
      VALUES (?, ?, datetime('now', '+30 seconds'), 'unified_data')
    `).bind(cacheKey, JSON.stringify(unifiedData)).run();
    
    // Queue background processing for data enrichment
    try {
      await c.env.DATA_PROCESSOR.send({
        type: 'enrich_drive_data',
        timestamp: Date.now(),
        data: { lastSync: new Date().toISOString() }
      });
    } catch (error) {
      console.error('Queue send failed:', error);
    }

    return c.json(unifiedData);

  } catch (error) {
    console.error('❌ Error in unified data endpoint:', error);
    
    // Fallback to last known good data from D1
    try {
      const fallback = await c.env.TESLA_DB.prepare(`
        SELECT cache_data 
        FROM api_cache 
        WHERE cache_key = 'unified_data_latest'
        ORDER BY created_at DESC 
        LIMIT 1
      `).first();

      if (fallback) {
        const data = JSON.parse(fallback.cache_data as string);
        data.tessieStatus = {
          connected: false,
          lastUpdate: new Date().toISOString(),
          dataFreshness: 'fallback',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        return c.json(data);
      }
    } catch (fallbackError) {
      console.error('Fallback failed:', fallbackError);
    }

    return c.json({
      error: 'Failed to fetch data and no fallback available',
      tessieStatus: {
        connected: false,
        lastUpdate: new Date().toISOString(),
        dataFreshness: 'unavailable',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }, 500);
  }
});

// API documentation
app.get('/api/docs', (c) => {
  return c.json({
    title: 'A Whittle Wandering - Unified Cloudflare Stack API',
    description: 'Complete Tesla road trip tracking with D1, R2, Analytics Engine, and Queues',
    version: '3.0.0',
    architecture: {
      database: 'Cloudflare D1 SQL Database',
      storage: 'Cloudflare R2 Object Storage', 
      cache: 'Cloudflare KV (auth tokens only)',
      analytics: 'Cloudflare Analytics Engine',
      queues: 'Cloudflare Queues'
    },
    endpoints: {
      'GET /api/v1/health': 'Comprehensive health check',
      'GET /api/v1/unified-data': 'Main data endpoint with D1 aggregation',
      'GET /api/docs': 'This documentation'
    }
  });
});

// Legacy endpoints for backward compatibility
app.get('/api/v1/trip/status', async (c) => {
  try {
    const journey = await c.env.TESLA_DB.prepare(`
      SELECT j.*, COUNT(DISTINCT sv.state_name) as states_visited
      FROM journeys j
      LEFT JOIN states_visited sv ON j.id = sv.journey_id
      WHERE j.id = 'continental-usa-2025'
      GROUP BY j.id
    `).first();

    return c.json({
      tripId: 'continental-usa-2025',
      status: journey?.status || 'active',
      progress: {
        statesVisited: journey?.states_visited || 0,
        totalStates: 48,
        completionPercentage: ((journey?.states_visited || 0) / 48) * 100
      },
      currentLocation: {
        state: 'Connecticut',
        coordinates: { latitude: 41.205, longitude: -73.150 },
        lastUpdate: new Date().toISOString()
      },
      statistics: {
        startDate: journey?.start_date || '2025-06-01',
        daysElapsed: Math.floor((Date.now() - new Date(journey?.start_date || '2025-06-01').getTime()) / (1000 * 60 * 60 * 24)),
        totalMiles: journey?.total_miles || 0,
        averageMilesPerDay: Math.round((journey?.total_miles || 0) / Math.max(1, Math.floor((Date.now() - new Date(journey?.start_date || '2025-06-01').getTime()) / (1000 * 60 * 60 * 24))))
      }
    });
  } catch (error) {
    console.error('Legacy trip status error:', error);
    return c.json({ error: 'Failed to fetch trip status' }, 500);
  }
});

// Helper function to fetch data from Tessie API
async function fetchTessieData(apiKey: string) {
  const vehiclesRes = await fetch('https://api.tessie.com/vehicles', {
    headers: { Authorization: `Bearer ${apiKey}` }
  });

  if (!vehiclesRes.ok) {
    throw new Error(`Tessie API error: ${vehiclesRes.status}`);
  }

  const vehicles = await vehiclesRes.json();
  
  // Try to get state for first vehicle
  let state = null;
  if (vehicles.results?.length > 0) {
    const vin = vehicles.results[0].vin;
    try {
      const stateRes = await fetch(`https://api.tessie.com/${vin}/state`, {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      if (stateRes.ok) {
        state = await stateRes.json();
      }
    } catch (error) {
      console.warn('Failed to fetch vehicle state:', error);
    }
  }

  return { vehicles, state };
}

// Helper function to process and store data in D1
async function processAndStoreInD1(db: D1Database, tessieData: any) {
  const { vehicles, state } = tessieData;
  
  if (!vehicles.results?.length) {
    throw new Error('No vehicles found in Tessie response');
  }

  const vehicle = vehicles.results[0];
  const currentState = state || vehicle.last_state;

  // Update vehicle info in D1
  await db.prepare(`
    INSERT OR REPLACE INTO vehicles (id, vin, display_name, vehicle_type, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `).bind(
    vehicle.vin || 'midnight-shadow',
    vehicle.vin,
    vehicle.display_name || 'Midnight Shadow',
    'Tesla Model Y'
  ).run();

  // Update current vehicle state
  if (currentState) {
    await db.prepare(`
      INSERT OR REPLACE INTO vehicle_state (
        vehicle_id, battery_level, battery_range, charging_state,
        latitude, longitude, heading, speed, odometer,
        inside_temp, outside_temp, timestamp, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      vehicle.vin || 'midnight-shadow',
      currentState.charge_state?.battery_level || 0,
      currentState.charge_state?.battery_range || 0,
      currentState.charge_state?.charging_state || 'Unknown',
      currentState.drive_state?.latitude || 0,
      currentState.drive_state?.longitude || 0,
      currentState.drive_state?.heading || 0,
      currentState.drive_state?.speed || 0,
      currentState.vehicle_state?.odometer || 0,
      currentState.climate_state?.inside_temp || null,
      currentState.climate_state?.outside_temp || null,
      new Date().toISOString()
    ).run();
  }

  // Get aggregated journey data from D1
  const journeyData = await db.prepare(`
    SELECT 
      j.*,
      vs.battery_level,
      vs.battery_range,
      vs.charging_state,
      vs.latitude,
      vs.longitude,
      vs.speed,
      vs.odometer,
      vs.inside_temp,
      vs.outside_temp,
      vs.timestamp as last_update,
      COUNT(DISTINCT sv.state_name) as states_visited,
      COALESCE(SUM(d.distance_miles), 0) as total_distance,
      COUNT(DISTINCT d.id) as total_drives
    FROM journeys j
    LEFT JOIN vehicle_state vs ON j.vehicle_id = vs.vehicle_id
    LEFT JOIN states_visited sv ON j.id = sv.journey_id
    LEFT JOIN drives d ON j.id = d.journey_id
    WHERE j.id = 'continental-usa-2025'
    GROUP BY j.id
  `).first();

  // Build unified response
  return {
    overview: {
      tripName: journeyData?.name || "A Whittle Wandering",
      vehicle: vehicle.display_name || "Tesla Model Y",
      startDate: journeyData?.start_date || "2025-06-01",
      daysElapsed: Math.floor((Date.now() - new Date(journeyData?.start_date || '2025-06-01').getTime()) / (1000 * 60 * 60 * 24)),
      totalMiles: Math.round(journeyData?.total_distance || 0),
      statesVisited: journeyData?.states_visited || 0,
      totalStates: 48
    },
    currentStatus: {
      battery: {
        level: journeyData?.battery_level || 0,
        range: Math.round(journeyData?.battery_range || 0),
        charging: journeyData?.charging_state || 'Unknown'
      },
      location: {
        coordinates: {
          lat: journeyData?.latitude || 0,
          lng: journeyData?.longitude || 0
        },
        state: await detectStateFromCoordinates(journeyData?.latitude || 0, journeyData?.longitude || 0),
        lastUpdate: journeyData?.last_update || new Date().toISOString()
      },
      vehicle: {
        odometer: Math.round(journeyData?.odometer || 0),
        speed: journeyData?.speed || 0,
        temperature: {
          inside: journeyData?.inside_temp,
          outside: journeyData?.outside_temp
        }
      }
    },
    tessieStatus: {
      connected: true,
      lastUpdate: new Date().toISOString(),
      dataFreshness: 'live'
    }
  };
}

// Helper function for state detection
async function detectStateFromCoordinates(lat: number, lng: number): Promise<string> {
  // Simplified state boundaries for Connecticut and nearby states
  const US_STATES = [
    { name: 'Connecticut', minLat: 40.9959, maxLat: 42.0508, minLng: -73.7277, maxLng: -71.7869 },
    { name: 'New York', minLat: 40.4774, maxLat: 45.0158, minLng: -79.7624, maxLng: -71.7774 },
    { name: 'Massachusetts', minLat: 41.2376, maxLat: 42.8868, minLng: -73.5081, maxLng: -69.9286 },
    { name: 'Rhode Island', minLat: 41.1460, maxLat: 42.0187, minLng: -71.8620, maxLng: -71.1208 },
    { name: 'New Jersey', minLat: 38.9281, maxLat: 41.3574, minLng: -75.5597, maxLng: -73.8937 }
  ];
  
  for (const state of US_STATES) {
    if (lat >= state.minLat && lat <= state.maxLat && lng >= state.minLng && lng <= state.maxLng) {
      return state.name;
    }
  }
  
  return 'Unknown';
}

// Catch-all route
app.all('*', (c) => {
  return c.json({
    error: 'Route not found',
    message: 'A Whittle Wandering - Unified Cloudflare Stack API',
    available_endpoints: [
      'GET /api/v1/health',
      'GET /api/v1/unified-data', 
      'GET /api/v1/trip/status',
      'GET /api/docs'
    ]
  }, 404);
});

export default app;
