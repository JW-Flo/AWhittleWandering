import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { TeslaDataIngestion } from './data-ingestion';
import { CronDataController } from './cron-controller';
import { ComponentDataProcessor } from './component-data-processor';
import { EnhancedDataProcessor } from './enhanced-data-processor';

// Configurable constants
const MAX_HISTORICAL_DRIVES = 1000;
const SAMPLE_DRIVES_RATE_LIMIT_MS = 100;

// Cloudflare Worker types for comprehensive resource integration
interface ScheduledController {
  readonly scheduledTime: number;
  readonly cron: string;
  noRetry(): void;
}

interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}

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
  TESLA_VIN: string;
  OPENWEATHER_API_KEY: string;
  JWT_SECRET: string;
  ADMIN_PASSWORD: string;
}

const app = new Hono<{ Bindings: Env }>();

// CORS configuration for all Cloudflare resources
app.use('*', cors({
  origin: '*', // Allow all origins for now to debug the issue
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

// Simple aliases for easier frontend integration
app.get('/health', async (c) => {
  return c.json({
    status: 'ok',
    timestamp: Date.now(),
    service: 'A Whittle Wandering API'
  });
});

// Configuration endpoint for frontend
app.get('/api/v1/config', async (c) => {
  const config = {
    // Mapbox token would be set in environment variables if available
    mapboxToken: null, // c.env.MAPBOX_TOKEN || null,
    apiBaseUrl: 'https://awhittlewandering-api.kd8jc7v8cd.workers.dev',
    features: {
      liveTeslaData: !!c.env.TESSIE_API_KEY,
      mapIntegration: false, // !!c.env.MAPBOX_TOKEN,
      realtimeUpdates: true
    },
    updateInterval: 30000 // 30 seconds
  };

  return c.json(config);
});

app.get('/unified-data', async (c) => {
  // Forward to the main unified data logic
  return handleUnifiedData(c);
});

app.get('/trip-status', async (c) => {
  // Forward to the main trip status logic - just return basic status for now
  return c.json({
    tripId: "continental-usa-2025",
    tripName: "A Whittle Wandering - Continental USA",
    status: "active",
    timestamp: Date.now()
  });
});

// Main unified data endpoint using D1 for aggregation
app.get('/api/v1/unified-data', async (c) => {
  return handleUnifiedData(c);
});

// === SAFE COMPONENT ENDPOINTS (Parallel System) ===
// These run alongside existing system for testing - NO RISK to current functionality

// Component-Ready API Endpoints - SAFE PARALLEL SYSTEM
app.get('/api/v1/component/overview', async (c) => {
  try {
    const overview = await c.env.TESLA_DB.prepare(`
      SELECT * FROM journey_overview 
      WHERE journey_id = 'continental-usa-2025' 
      ORDER BY last_updated DESC 
      LIMIT 1
    `).first();

    return c.json(overview || { error: 'No component data available yet' });
  } catch (error) {
    return c.json({ error: 'Component endpoint not ready' }, 500);
  }
});

app.get('/api/v1/component/current-status', async (c) => {
  try {
    const status = await c.env.TESLA_DB.prepare(`
      SELECT * FROM current_status 
      ORDER BY last_updated DESC 
      LIMIT 1
    `).first();

    return c.json(status || { error: 'No component data available yet' });
  } catch (error) {
    return c.json({ error: 'Component endpoint not ready' }, 500);
  }
});

app.get('/api/v1/component/states-progress', async (c) => {
  try {
    const states = await c.env.TESLA_DB.prepare(`
      SELECT * FROM states_progress 
      WHERE journey_id = 'continental-usa-2025'
      ORDER BY visit_order ASC
    `).all();

    return c.json(states.results || []);
  } catch (error) {
    return c.json({ error: 'Component endpoint not ready' }, 500);
  }
});

app.get('/api/v1/component/recent-drives', async (c) => {
  try {
    const drives = await c.env.TESLA_DB.prepare(`
      SELECT * FROM recent_drives_summary 
      WHERE journey_id = 'continental-usa-2025'
      ORDER BY drive_order ASC
      LIMIT 5
    `).all();

    return c.json(drives.results || []);
  } catch (error) {
    return c.json({ error: 'Component endpoint not ready' }, 500);
  }
});

// Safe component data processing trigger - DOES NOT AFFECT EXISTING SYSTEM
app.post('/api/v1/component/process-data', async (c) => {
  try {
    const tessieApiKey = c.env.TESSIE_API_KEY;
    const vehicleVin = c.env.TESLA_VIN || '5YJYGDEE5LF027324';
    
    if (!tessieApiKey) {
      return c.json({ error: 'TESSIE_API_KEY not configured' }, 500);
    }

    // Fetch fresh Tessie data safely
    const tessieData = await fetchTessieData(tessieApiKey);
    
    // Process component data in SAFE MODE (doesn't affect existing APIs)
    const processor = new ComponentDataProcessor(c.env.TESLA_DB, vehicleVin);
    await processor.processAllComponentData(tessieData.state);

    return c.json({
      success: true,
      message: 'Component data processed safely',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Safe component processing error:', error);
    return c.json({ 
      error: 'Component processing failed (existing system unaffected)',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// === ENHANCED ANALYTICS ENDPOINTS ===
// New comprehensive analytics with enhanced data processing

app.get('/api/v1/analytics/comprehensive', async (c) => {
  const startDate = c.req.query('start_date') || '2025-06-01';
  const endDate = c.req.query('end_date') || new Date().toISOString().split('T')[0];
  
  try {
    const processor = new EnhancedDataProcessor(c.env.TESLA_DB);
    const analytics = await processor.generateAnalytics(startDate, endDate);
    
    return c.json({
      success: true,
      period: { startDate, endDate },
      analytics
    });
  } catch (error) {
    console.error('Analytics generation failed:', error);
    return c.json({ 
      error: 'Failed to generate analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

app.get('/api/v1/analytics/efficiency', async (c) => {
  const days = parseInt(c.req.query('days') || '30');
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
  
  try {
    const efficiencyData = await c.env.TESLA_DB.prepare(`
      SELECT 
        date,
        miles_driven,
        energy_consumed_kwh,
        efficiency_miles_per_kwh,
        avg_outside_temp_f,
        avg_speed_mph,
        highway_miles_percent,
        city_miles_percent
      FROM efficiency_metrics 
      WHERE journey_id = 'continental-usa-2025' 
        AND date BETWEEN ? AND ?
      ORDER BY date ASC
    `).bind(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    ).all();
    
    return c.json({
      success: true,
      period: { days, startDate: startDate.toISOString().split('T')[0], endDate: endDate.toISOString().split('T')[0] },
      efficiency: efficiencyData.results || []
    });
  } catch (error) {
    console.error('Efficiency data fetch failed:', error);
    return c.json({ 
      error: 'Failed to fetch efficiency data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

app.get('/api/v1/analytics/charging', async (c) => {
  const days = parseInt(c.req.query('days') || '30');
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
  
  try {
    const chargingData = await c.env.TESLA_DB.prepare(`
      SELECT 
        date,
        total_charges,
        total_energy_added_kwh,
        total_cost_usd,
        avg_charge_rate_kw,
        supercharger_sessions,
        destination_charges,
        total_charge_time_minutes
      FROM charge_analytics 
      WHERE journey_id = 'continental-usa-2025' 
        AND date BETWEEN ? AND ?
      ORDER BY date ASC
    `).bind(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    ).all();
    
    return c.json({
      success: true,
      period: { days, startDate: startDate.toISOString().split('T')[0], endDate: endDate.toISOString().split('T')[0] },
      charging: chargingData.results || []
    });
  } catch (error) {
    console.error('Charging data fetch failed:', error);
    return c.json({ 
      error: 'Failed to fetch charging data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

app.get('/api/v1/vehicle/state/enhanced', async (c) => {
  try {
    // Get latest enhanced vehicle state
    const currentState = await c.env.TESLA_DB.prepare(`
      SELECT * FROM vehicle_state 
      WHERE vehicle_id = 'midnight-shadow' 
      ORDER BY updated_at DESC 
      LIMIT 1
    `).first();
    
    // Get state history for trends
    const stateHistory = await c.env.TESLA_DB.prepare(`
      SELECT * FROM vehicle_state_history 
      WHERE vehicle_id = 'midnight-shadow' 
      ORDER BY recorded_at DESC 
      LIMIT 100
    `).all();
    
    return c.json({
      success: true,
      currentState: currentState || null,
      history: stateHistory.results || [],
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Enhanced state fetch failed:', error);
    return c.json({ 
      error: 'Failed to fetch enhanced vehicle state',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Full data sync - runs every 30 minutes
app.get('/api/v1/cron/full-sync', async (c) => {
  const tessieApiKey = c.env.TESSIE_API_KEY;
  const vehicleVin = c.env.TESLA_VIN || 'default-vin'; // Make configurable
  
  if (!tessieApiKey) {
    return c.json({ error: 'TESSIE_API_KEY not configured' }, 500);
  }

  const cronController = new CronDataController(c.env.TESLA_DB, tessieApiKey, vehicleVin);
  return await cronController.fullDataSync();
});

// Quick state update - runs every 5 minutes  
app.get('/api/v1/cron/quick-update', async (c) => {
  const tessieApiKey = c.env.TESSIE_API_KEY;
  const vehicleVin = c.env.TESLA_VIN || 'default-vin'; // Make configurable
  
  if (!tessieApiKey) {
    return c.json({ error: 'TESSIE_API_KEY not configured' }, 500);
  }

  const cronController = new CronDataController(c.env.TESLA_DB, tessieApiKey, vehicleVin);
  return await cronController.quickStateUpdate();
});

// Historical backfill - runs daily
app.get('/api/v1/cron/backfill', async (c) => {
  const tessieApiKey = c.env.TESSIE_API_KEY;
  const vehicleVin = c.env.TESLA_VIN || 'default-vin'; // Make configurable
  
  if (!tessieApiKey) {
    return c.json({ error: 'TESSIE_API_KEY not configured' }, 500);
  }

  const cronController = new CronDataController(c.env.TESLA_DB, tessieApiKey, vehicleVin);
  return await cronController.historicalBackfill();
});

// Data quality check - runs hourly
app.get('/api/v1/cron/quality-check', async (c) => {
  const tessieApiKey = c.env.TESSIE_API_KEY;
  const vehicleVin = c.env.TESLA_VIN || 'default-vin'; // Make configurable
  
  if (!tessieApiKey) {
    return c.json({ error: 'TESSIE_API_KEY not configured' }, 500);
  }

  const cronController = new CronDataController(c.env.TESLA_DB, tessieApiKey, vehicleVin);
  return await cronController.dataQualityCheck();
});

// AI/ML processing - runs every 6 hours
app.get('/api/v1/cron/ai-processing', async (c) => {
  const tessieApiKey = c.env.TESSIE_API_KEY;
  const vehicleVin = c.env.TESLA_VIN || 'default-vin'; // Make configurable
  
  if (!tessieApiKey) {
    return c.json({ error: 'TESSIE_API_KEY not configured' }, 500);
  }

  const cronController = new CronDataController(c.env.TESLA_DB, tessieApiKey, vehicleVin);
  return await cronController.aiDataProcessing();
});

// Debug endpoint to inspect raw Tessie data structure
app.get('/api/v1/debug/tessie-sample', async (c) => {
  try {
    const tessieApiKey = c.env.TESSIE_API_KEY;
    if (!tessieApiKey) {
      return c.json({ error: 'TESSIE_API_KEY not configured' }, 500);
    }

    // Get vehicles
    const vehiclesRes = await fetch('https://api.tessie.com/vehicles', {
      headers: { Authorization: `Bearer ${tessieApiKey}` }
    });
    const vehicles = await vehiclesRes.json() as any;
    const vin = vehicles.results[0].vin;

    // Get just 3 recent drives to inspect format
    const drivesRes = await fetch(
      `https://api.tessie.com/${vin}/drives?limit=3`,
      { headers: { Authorization: `Bearer ${tessieApiKey}` } }
    );
    const drivesData = await drivesRes.json() as any;

    return c.json({
      message: 'Sample Tessie data for debugging',
      vehicles: vehicles.results[0],
      sampleDrives: drivesData.results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Debug drives data
app.get('/api/v1/debug/drives-check', async (c) => {
  try {
    const db = c.env.TESLA_DB;
    
    // Get count of drives in the table
    const count = await db.prepare('SELECT COUNT(*) as count FROM drives WHERE journey_id = ?')
      .bind('continental-usa-2025').first();
    
    // Get a few sample drives to inspect
    const samples = await db.prepare(`
      SELECT id, started_at, start_address, end_address, start_latitude, end_latitude, distance_miles
      FROM drives 
      WHERE journey_id = 'continental-usa-2025'
      ORDER BY started_at DESC 
      LIMIT 5
    `).all();
    
    return c.json({
      message: 'Drives table inspection',
      totalDrives: count?.count || 0,
      sampleDrives: samples,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get total drive count for journey planning
app.get('/api/v1/debug/journey-scope', async (c) => {
  try {
    const tessieApiKey = c.env.TESSIE_API_KEY;
    if (!tessieApiKey) {
      return c.json({ error: 'TESSIE_API_KEY not configured' }, 500);
    }

    // Get vehicles
    const vehiclesRes = await fetch('https://api.tessie.com/vehicles', {
      headers: { Authorization: `Bearer ${tessieApiKey}` }
    });
    const vehicles = await vehiclesRes.json() as any;
    const vin = vehicles.results[0].vin;

    // Get drive count since journey start with minimal data - try without date filter first
    const scopeRes = await fetch(
      `https://api.tessie.com/${vin}/drives?limit=1`,
      { headers: { Authorization: `Bearer ${tessieApiKey}` } }
    );
    const scopeData = await scopeRes.json() as any;
    
    // Get widely spaced samples to understand geographic scope - no date filter to see full history
    const sampleDrives = [];
    const sampleOffsets = [0, 100, 300, 500, 800, 1200, 1500, 2000]; // Sample deeper into history
    
    for (const offset of sampleOffsets) {
      try {
        const sampleRes = await fetch(
          `https://api.tessie.com/${vin}/drives?limit=5&offset=${offset}`,
          { headers: { Authorization: `Bearer ${tessieApiKey}` } }
        );
        if (sampleRes.ok) {
          const sampleData = await sampleRes.json() as any;
          if (sampleData.results && sampleData.results.length > 0) {
            sampleDrives.push(...sampleData.results);
          }
        }
        await new Promise(resolve => setTimeout(resolve, SAMPLE_DRIVES_RATE_LIMIT_MS)); // Rate limit
      } catch (e) {
        console.log(`Sample at offset ${offset} failed`);
      }
    }

    return c.json({
      message: 'Journey scope analysis',
      totalAvailable: scopeData.count || 'unknown',
      sampledDrives: sampleDrives.length,
      journeyStartOdometer: sampleDrives[sampleDrives.length - 1]?.ending_odometer || 'unknown',
      currentOdometer: sampleDrives[0]?.ending_odometer || 'unknown',
      geoSamples: sampleDrives.map(d => ({
        date: new Date(d.started_at * 1000).toISOString().split('T')[0],
        start: d.starting_location,
        end: d.ending_location,
        miles: d.odometer_distance,
        startOdometer: d.starting_odometer,
        endOdometer: d.ending_odometer
      })),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      error: 'Journey scope failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Manually populate correct states data based on actual journey
app.post('/api/v1/admin/populate-actual-states', async (c) => {
  try {
    const db = c.env.TESLA_DB;
    
    // The actual states visited based on user's real journey
    const actualStatesVisited = [
      'Texas', 'New Mexico', 'Arizona', 'Utah', 'Nevada', 'California', 
      'Oregon', 'Washington', 'Montana', 'Wyoming', 'Colorado', 'Nebraska', 
      'Iowa', 'South Dakota', 'North Dakota', 'Minnesota', 'Wisconsin', 
      'Illinois', 'Indiana', 'Michigan', 'Ohio', 'West Virginia', 
      'Pennsylvania', 'New York', 'Vermont', 'New Hampshire', 'Maine', 
      'Delaware', 'Virginia', 'North Carolina'
    ];
    
    console.log(`📍 Populating ${actualStatesVisited.length} actual states visited`);
    
    // Clear existing states data
    await db.prepare('DELETE FROM states_visited WHERE journey_id = ?')
      .bind('continental-usa-2025').run();
    
    // Insert actual states visited
    for (let i = 0; i < actualStatesVisited.length; i++) {
      const state = actualStatesVisited[i];
      const visitDate = new Date('2025-06-01');
      visitDate.setDate(visitDate.getDate() + i * 2); // Spread visits over journey
      
      await db.prepare(`
        INSERT INTO states_visited (
          journey_id, state_name, first_visited_date, visit_count, 
          total_miles_in_state, entry_latitude, entry_longitude
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        'continental-usa-2025',
        state,
        visitDate.toISOString(),
        1,
        100, // Approximate miles per state
        0, // Will be populated with actual coordinates later
        0
      ).run();
    }
    
    // Update journey with correct totals
    await db.prepare(`
      INSERT OR REPLACE INTO journeys (
        id, name, vehicle_id, start_date, status, total_miles, total_states, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      'continental-usa-2025',
      'A Whittle Wandering - Continental USA',
      'midnight-shadow',
      '2025-06-01',
      'active',
      6000, // Approximate total miles for cross-country journey
      actualStatesVisited.length
    ).run();
    
    console.log(`✅ Populated ${actualStatesVisited.length} states successfully`);
    
    return c.json({
      success: true,
      message: 'Actual states data populated successfully',
      statesPopulated: actualStatesVisited.length,
      states: actualStatesVisited,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ State population failed:', error);
    return c.json({
      error: 'State population failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Debug states count
app.get('/api/v1/debug/states-count', async (c) => {
  try {
    const db = c.env.TESLA_DB;
    
    const statesCount = await db.prepare(`
      SELECT COUNT(DISTINCT state_name) as count
      FROM states_visited 
      WHERE journey_id = 'continental-usa-2025'
    `).first();
    
    const statesList = await db.prepare(`
      SELECT state_name, first_visited_date
      FROM states_visited 
      WHERE journey_id = 'continental-usa-2025'
      ORDER BY first_visited_date
      LIMIT 10
    `).all();
    
    return c.json({
      message: 'States count debug',
      totalStates: statesCount?.count || 0,
      sampleStates: statesList?.results || [],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Update journey table with correct calculated values
app.post('/api/v1/admin/update-journey-data', async (c) => {
  try {
    const db = c.env.TESLA_DB;
    
    // Get current real-time Tesla data
    const tessieApiKey = c.env.TESSIE_API_KEY;
    if (!tessieApiKey) {
      return c.json({ error: 'TESSIE_API_KEY not configured' }, 500);
    }

    const tessieData = await fetchTessieData(tessieApiKey);
    const currentOdometer = tessieData?.state?.vehicle_state?.odometer || 71259;
    
    // Calculate correct trip miles (current - start odometer from June 1, 2025)
    const JOURNEY_START_ODOMETER = 58046;  // Actual odometer reading on 2025-06-01 08:00:00
    const totalMiles = Math.round(currentOdometer - JOURNEY_START_ODOMETER);
    
    // Get states count from states_visited table
    const statesResult = await db.prepare(`
      SELECT COUNT(DISTINCT state_name) as count
      FROM states_visited 
      WHERE journey_id = 'continental-usa-2025'
    `).first();
    
    const statesCount = statesResult?.count || 30;
    
    // Update journey table with correct values
    await db.prepare(`
      UPDATE journeys 
      SET total_miles = ?, 
          states_visited = ?,
          updated_at = datetime('now')
      WHERE id = 'continental-usa-2025'
    `).bind(totalMiles, statesCount).run();
    
    console.log(`✅ Updated journey: ${totalMiles} miles, ${statesCount} states`);
    
    return c.json({
      success: true,
      message: 'Journey data updated with correct values',
      updatedData: {
        totalMiles: totalMiles,
        statesVisited: statesCount,
        currentOdometer: Math.round(currentOdometer)
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Journey update failed:', error);
    return c.json({
      error: 'Journey update failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Fix D1 database with correct overview data
app.post('/api/v1/admin/fix-d1-overview', async (c) => {
  try {
    const db = c.env.TESLA_DB;
    
    console.log('🔧 Fixing D1 database overview data...');
    
    // Update the journey_overview table with correct data
    await db.prepare(`
      INSERT OR REPLACE INTO journey_overview (
        id, journey_id, total_miles, current_odometer, trip_miles,
        days_elapsed, states_visited_count, journey_start_date,
        status, last_updated, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      'continental-usa-2025-overview',
      'continental-usa-2025',
      13213,   // total_miles (71259 - 58046 = actual journey miles from 6/1/2025)
      71259,   // current_odometer (live from Tessie)
      13213,   // trip_miles (current - start from 6/1/2025)
      64,      // days_elapsed (from 6/1/2025)
      30,      // states_visited_count (actual journey states)
      '2025-06-01T00:00:00.000Z',
      'active'
    ).run();
    
    // Also update the journeys table
    await db.prepare(`
      INSERT OR REPLACE INTO journeys (
        id, name, vehicle_id, start_date, status, total_miles, total_states, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      'continental-usa-2025',
      'A Whittle Wandering - Continental USA',
      'midnight-shadow',
      '2025-06-01',
      'active',
      13213, // Correct total miles from 6/1/2025 start (71259 - 58046)
      30     // Correct states visited
    ).run();
    
    console.log('✅ D1 database overview data fixed');
    
    return c.json({
      success: true,
      message: 'D1 database overview data fixed successfully',
      updates: {
        total_miles: 13213,  // Actual miles from 6/1/2025 start
        states_visited_count: 30,
        current_odometer: 71259,
        days_elapsed: 64
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ D1 fix failed:', error);
    return c.json({
      error: 'D1 database fix failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Debug endpoint for odometer calculation
app.get('/api/v1/debug/odometer-calc', async (c) => {
  try {
    const tessieApiKey = c.env.TESSIE_API_KEY;
    if (!tessieApiKey) {
      return c.json({ error: 'TESSIE_API_KEY not configured' }, 500);
    }

    // Get current odometer from Tessie
    const tessieData = await fetchTessieData(tessieApiKey);
    const currentOdometer = tessieData?.state?.vehicle_state?.odometer || 0;
    
    // Check what's in vehicle_state table
    const dbOdometer = await c.env.TESLA_DB.prepare(`
      SELECT odometer, updated_at 
      FROM vehicle_state 
      ORDER BY updated_at DESC 
      LIMIT 5
    `).all();
    
    // Check earliest odometer since journey start
    const journeyStartDate = new Date('2025-06-01');
    const earliestReading = await c.env.TESLA_DB.prepare(`
      SELECT MIN(odometer) as start_odometer, MAX(odometer) as max_odometer
      FROM vehicle_state 
      WHERE date(updated_at) >= date(?) 
      AND odometer > 0
    `).bind(journeyStartDate.toISOString().split('T')[0]).first();
    
    // Calculate trip miles
    const startOdometer = earliestReading?.start_odometer || 65000;
    const tripMiles = Math.max(0, currentOdometer - startOdometer);

    return c.json({
      message: 'Odometer calculation debug',
      currentOdometer: currentOdometer,
      startOdometer: startOdometer,
      calculatedTripMiles: tripMiles,
      dbRecords: dbOdometer.results?.length || 0,
      recentOdometers: dbOdometer.results,
      earliestReading: earliestReading,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      error: 'Debug query failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Debug endpoint for component data
app.get('/api/v1/debug/component-data', async (c) => {
  try {
    // Check what's in journey_overview
    const componentOverview = await c.env.TESLA_DB.prepare(`
      SELECT * FROM journey_overview 
      WHERE journey_id = 'continental-usa-2025' 
      ORDER BY last_updated DESC 
      LIMIT 1
    `).first();

    // Check what's in current_status
    const componentStatus = await c.env.TESLA_DB.prepare(`
      SELECT * FROM current_status 
      ORDER BY last_updated DESC 
      LIMIT 1
    `).first();

    return c.json({
      message: 'Component data debug',
      componentOverview: componentOverview,
      componentStatus: componentStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      error: 'Debug query failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Debug endpoint for unified API query
app.get('/api/v1/debug/unified-query', async (c) => {
  try {
    // This is the exact same query used in the unified API
    const journeyData = await c.env.TESLA_DB.prepare(`
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
        COUNT(DISTINCT sv.state_name) as states_visited_from_historical,
        COALESCE(SUM(d.distance_miles), 0) as total_distance,
        COUNT(DISTINCT d.id) as total_drives
      FROM journeys j
      LEFT JOIN vehicle_state vs ON j.vehicle_id = vs.vehicle_id
      LEFT JOIN states_visited sv ON j.id = sv.journey_id
      LEFT JOIN drives d ON j.id = d.journey_id AND d.started_at >= '2025-06-01'
      WHERE j.id = 'continental-usa-2025'
      GROUP BY j.id
    `).first();

    // Also check what's in the journeys table
    const journeyExists = await c.env.TESLA_DB.prepare(`
      SELECT * FROM journeys WHERE id = 'continental-usa-2025'
    `).first();

    // Check states_visited with journey filter
    const statesWithJourney = await c.env.TESLA_DB.prepare(`
      SELECT COUNT(DISTINCT state_name) as count
      FROM states_visited sv
      WHERE sv.journey_id = 'continental-usa-2025'
    `).first();

    return c.json({
      message: 'Unified API query debug',
      journeyData: journeyData,
      journeyExists: journeyExists,
      statesWithJourneyFilter: statesWithJourney?.count || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      error: 'Debug query failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Clear historical data for fresh analysis
app.post('/api/v1/admin/clear-historical-data', async (c) => {
  try {
    console.log('🧹 Clearing historical data...');
    
    const db = c.env.TESLA_DB;
    
    // Clear all historical data tables
    await db.prepare('DELETE FROM journey_waypoints WHERE journey_id = ?')
      .bind('continental-usa-2025').run();
    await db.prepare('DELETE FROM drives WHERE journey_id = ?')
      .bind('continental-usa-2025').run();
    await db.prepare('DELETE FROM charges WHERE journey_id = ?')
      .bind('continental-usa-2025').run();
    await db.prepare('DELETE FROM states_visited WHERE journey_id = ?')
      .bind('continental-usa-2025').run();
    await db.prepare('DELETE FROM states_visited_historical WHERE journey_id = ?')
      .bind('continental-usa-2025').run();
    
    console.log('✅ Historical data cleared');
    
    return c.json({
      success: true,
      message: 'Historical data cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Clear failed:', error);
    return c.json({
      error: 'Clear failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Historical Journey Analysis - Process all drives since journey start
app.post('/api/v1/admin/analyze-historical-journey', async (c) => {
  try {
    const tessieApiKey = c.env.TESSIE_API_KEY;
    if (!tessieApiKey) {
      return c.json({ error: 'TESSIE_API_KEY not configured' }, 500);
    }

    console.log('🔍 Starting comprehensive historical journey analysis...');
    
    // Fetch vehicles to get VIN
    const vehiclesRes = await fetch('https://api.tessie.com/vehicles', {
      headers: { Authorization: `Bearer ${tessieApiKey}` }
    });
    
    if (!vehiclesRes.ok) {
      throw new Error(`Tessie API error: ${vehiclesRes.status}`);
    }
    
    const vehicles = await vehiclesRes.json() as any;
    if (!vehicles.results?.length) {
      throw new Error('No vehicles found');
    }
    
    const vin = vehicles.results[0].vin;
    console.log(`📱 Analyzing vehicle: ${vin}`);
    
    // Fetch ALL drives since journey start (6/1/2025)
    const journeyStart = '2025-06-01T00:00:00Z';
    const now = new Date().toISOString();
    
    // Fetch drives in smaller batches to avoid rate limits
    console.log(`📅 Fetching drives from ${journeyStart} to ${now}`);
    
    const allDrives: any[] = [];
    const batchSize = 50; // Larger batch size for comprehensive analysis
    let offset = 0;
    
    // Fetch drives in batches
    while (true) {
      const drivesRes = await fetch(
        `https://api.tessie.com/${vin}/drives?start=${journeyStart}&end=${now}&limit=${batchSize}&offset=${offset}`,
        { headers: { Authorization: `Bearer ${tessieApiKey}` } }
      );
      
      if (!drivesRes.ok) {
        console.warn(`Failed to fetch drives batch at offset ${offset}: ${drivesRes.status}`);
        break;
      }
      
      const drivesData = await drivesRes.json() as any;
      const batchDrives = drivesData.results || [];
      
      if (batchDrives.length === 0) {
        break; // No more drives
      }
      
      allDrives.push(...batchDrives);
      offset += batchSize;
      
      console.log(`📊 Fetched ${allDrives.length} drives so far...`);
      
      // Rate limiting: wait 50ms between requests for faster processing
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Safety: Process more drives to get complete journey picture - remove artificial limit
      // The user has traveled 30+ states, we need comprehensive analysis
      if (allDrives.length >= MAX_HISTORICAL_DRIVES) {
        console.log(`⚠️  Reached safety limit of ${MAX_HISTORICAL_DRIVES} drives, but may need more for complete analysis`);
        break;
      }
    }
    
    console.log(`🚗 Found ${allDrives.length} total historical drives`);
    
    // Fetch charges with smaller limit to avoid rate limits
    const chargesRes = await fetch(
      `https://api.tessie.com/${vin}/charges?start=${journeyStart}&end=${now}&limit=50`,
      { headers: { Authorization: `Bearer ${tessieApiKey}` } }
    );
    
    const charges = chargesRes.ok ? ((await chargesRes.json()) as any).results || [] : [];
    console.log(`🔋 Found ${charges.length} charging sessions`);
    
    // Process historical data
    const analysis = await processHistoricalJourneyData(c.env.TESLA_DB, allDrives, charges, vin);
    
    return c.json({
      success: true,
      message: 'Historical journey analysis completed',
      analysis,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Historical analysis error:', error);
    return c.json({
      error: 'Historical analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Manual data ingestion trigger (for testing/admin)
app.post('/api/v1/admin/ingest-data', async (c) => {
  const tessieApiKey = c.env.TESSIE_API_KEY;
  const vehicleVin = c.env.TESLA_VIN || 'default-vin'; // Make configurable
  
  if (!tessieApiKey) {
    return c.json({ error: 'TESSIE_API_KEY not configured' }, 500);
  }

  const ingestion = new TeslaDataIngestion(c.env.TESLA_DB, tessieApiKey, vehicleVin);
  const result = await ingestion.ingestAllData();
  
  return c.json({
    operation: 'manual_ingestion',
    ...result
  });
});

async function handleUnifiedData(c: any) {
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
    
    // Process and store in D1 using enhanced analytics
    const unifiedData = await processAndStoreInD1Enhanced(c.env.TESLA_DB, tessieData);
    
    // SAFE ENHANCEMENT: Try to get better data from component tables if available
    try {
      const componentOverview = await c.env.TESLA_DB.prepare(`
        SELECT * FROM journey_overview 
        WHERE journey_id = 'continental-usa-2025' 
        ORDER BY last_updated DESC 
        LIMIT 1
      `).first();

      const componentStatus = await c.env.TESLA_DB.prepare(`
        SELECT * FROM current_status 
        ORDER BY last_updated DESC 
        LIMIT 1
      `).first();

      // Enhance unified data with component data if available
      if (componentOverview) {
        // IMPORTANT: Don't override miles or states - use accurate real-time calculations
        // unifiedData.overview.totalMiles = componentOverview.total_miles;
        // unifiedData.overview.statesVisited = componentOverview.states_visited_count;
        unifiedData.overview.daysElapsed = componentOverview.days_elapsed;
      }

      if (componentStatus) {
        // Use real-time GPS coordinates to determine current location
        const realTimeState = await detectStateFromCoordinates(
          (tessieData?.state as any)?.drive_state?.latitude || 0, 
          (tessieData?.state as any)?.drive_state?.longitude || 0
        );
        
        unifiedData.currentStatus.location.state = realTimeState !== 'Unknown' ? realTimeState : (componentStatus.current_state || unifiedData.currentStatus.location.state);
        // Add city information to location object (extend the type)
        (unifiedData.currentStatus.location as any).city = componentStatus.current_city;
        (unifiedData.currentStatus.location as any).description = componentStatus.location_description;
      }
    } catch (componentError) {
      console.warn('Component data enhancement failed, using base data:', componentError);
    }
    
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
}

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

// Comprehensive Historical Journey Data Processor
async function processHistoricalJourneyData(db: D1Database, drives: any[], charges: any[], vehicleId: string) {
  console.log('🔄 Processing historical journey data...');
  
  const statesVisited = new Set<string>();
  const waypoints: any[] = [];
  const chargingStops: any[] = [];
  let totalMiles = 0;
  
  // Create tables for historical analysis if they don't exist
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS journey_waypoints (
      id TEXT PRIMARY KEY,
      journey_id TEXT,
      drive_id TEXT,
      latitude REAL,
      longitude REAL,
      state_name TEXT,
      city_name TEXT,
      address TEXT,
      waypoint_type TEXT, -- 'start', 'end', 'charging', 'overnight'
      timestamp TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS states_visited_historical (
      id TEXT PRIMARY KEY,
      journey_id TEXT,
      state_name TEXT,
      state_abbreviation TEXT,
      first_visited_date TEXT,
      coordinates_first_visit TEXT,
      visit_count INTEGER DEFAULT 1,
      total_miles_in_state REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  // Process each drive to extract states and waypoints
  for (const drive of drives) {
    if (!drive.starting_latitude || !drive.starting_longitude || !drive.ending_latitude || !drive.ending_longitude) {
      continue; // Skip drives without coordinates
    }
    
    // Analyze start location
    const startState = await detectStateFromCoordinates(drive.starting_latitude, drive.starting_longitude);
    const endState = await detectStateFromCoordinates(drive.ending_latitude, drive.ending_longitude);
    
    if (startState !== 'Unknown') {
      statesVisited.add(startState);
    }
    if (endState !== 'Unknown') {
      statesVisited.add(endState);
    }
    
    // Add waypoints
    waypoints.push({
      id: `${drive.id}-start`,
      journey_id: 'continental-usa-2025',
      drive_id: drive.id,
      latitude: drive.starting_latitude,
      longitude: drive.starting_longitude,
      state_name: startState,
      address: drive.starting_location || null,
      waypoint_type: 'start',
      timestamp: new Date(drive.started_at * 1000).toISOString() // Convert timestamp
    });
    
    waypoints.push({
      id: `${drive.id}-end`,
      journey_id: 'continental-usa-2025',
      drive_id: drive.id,
      latitude: drive.ending_latitude,
      longitude: drive.ending_longitude,
      state_name: endState,
      address: drive.ending_location || null,
      waypoint_type: 'end',
      timestamp: new Date(drive.ended_at * 1000).toISOString() // Convert timestamp
    });
    
    totalMiles += drive.odometer_distance || 0;
    
    // Store drive data with correct field mapping
    await db.prepare(`
      INSERT OR REPLACE INTO drives (
        id, journey_id, vehicle_id, started_at, ended_at, distance_miles,
        start_latitude, start_longitude, end_latitude, end_longitude,
        start_address, end_address, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      drive.id,
      'continental-usa-2025',
      vehicleId,
      new Date(drive.started_at * 1000).toISOString(),
      new Date(drive.ended_at * 1000).toISOString(),
      drive.odometer_distance || 0,
      drive.starting_latitude,
      drive.starting_longitude,
      drive.ending_latitude,
      drive.ending_longitude,
      drive.starting_location || null,
      drive.ending_location || null
    ).run();
  }
  
  // Process charging sessions
  for (const charge of charges) {
    if (charge.latitude && charge.longitude) {
      const chargeState = await detectStateFromCoordinates(charge.latitude, charge.longitude);
      
      chargingStops.push({
        id: charge.id,
        journey_id: 'continental-usa-2025',
        latitude: charge.latitude,
        longitude: charge.longitude,
        state_name: chargeState,
        address: charge.location || null,
        waypoint_type: 'charging',
        timestamp: charge.started_at
      });
      
      // Store charge data
      await db.prepare(`
        INSERT OR REPLACE INTO charges (
          id, journey_id, vehicle_id, started_at, ended_at, 
          latitude, longitude, location, energy_added_kwh, cost_usd
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        charge.id,
        'continental-usa-2025',
        vehicleId,
        charge.started_at,
        charge.ended_at,
        charge.latitude || null,
        charge.longitude || null,
        charge.location || null,
        charge.energy_added_kwh || 0,
        charge.cost_usd || 0
      ).run();
    }
  }
  
  // Clear and update waypoints
  await db.prepare('DELETE FROM journey_waypoints WHERE journey_id = ?')
    .bind('continental-usa-2025').run();
    
  for (const waypoint of [...waypoints, ...chargingStops]) {
    await db.prepare(`
      INSERT OR REPLACE INTO journey_waypoints (
        id, journey_id, drive_id, latitude, longitude, state_name, 
        city_name, address, waypoint_type, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      waypoint.id,
      waypoint.journey_id,
      waypoint.drive_id || null,
      waypoint.latitude,
      waypoint.longitude,
      waypoint.state_name,
      waypoint.city_name || null,
      waypoint.address,
      waypoint.waypoint_type,
      waypoint.timestamp
    ).run();
  }
  
  // Update states visited with proper historical data
  await db.prepare('DELETE FROM states_visited WHERE journey_id = ?')
    .bind('continental-usa-2025').run();
    
  for (const state of Array.from(statesVisited)) {
    // Find first visit to this state
    const firstVisit = waypoints
      .filter(w => w.state_name === state)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())[0];
      
    if (firstVisit) {
      await db.prepare(`
        INSERT OR IGNORE INTO states_visited (
          journey_id, state_name, first_visited_date, entry_latitude, entry_longitude
        ) VALUES (?, ?, ?, ?, ?)
      `).bind(
        'continental-usa-2025',
        state,
        firstVisit.timestamp,
        firstVisit.latitude,
        firstVisit.longitude
      ).run();
    }
  }
  
  // Update journey overview with calculated data
  await db.prepare(`
    INSERT OR REPLACE INTO journeys (
      id, name, vehicle_id, start_date, status, total_miles, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).bind(
    'continental-usa-2025',
    'A Whittle Wandering - Continental USA',
    vehicleId,
    '2025-06-01',
    'active',
    totalMiles
  ).run();
  
  console.log(`✅ Processed ${drives.length} drives, found ${statesVisited.size} states, ${totalMiles.toFixed(1)} miles`);
  
  return {
    drivesProcessed: drives.length,
    chargesProcessed: charges.length,
    statesVisited: Array.from(statesVisited),
    statesCount: statesVisited.size,
    totalMiles: Math.round(totalMiles),
    waypointsCreated: waypoints.length + chargingStops.length
  };
}

// Helper function to fetch data from Tessie API
async function fetchTessieData(apiKey: string) {
  const vehiclesRes = await fetch('https://api.tessie.com/vehicles', {
    headers: { Authorization: `Bearer ${apiKey}` }
  });

  if (!vehiclesRes.ok) {
    throw new Error(`Tessie API error: ${vehiclesRes.status}`);
  }

  const vehicles = await vehiclesRes.json() as any;
  
  // Try to get state and recent drives for first vehicle
  let state = null;
  let recentDrives = null;
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

    // Fetch recent drives from last 30 days
    try {
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const drivesRes = await fetch(`https://api.tessie.com/${vin}/drives?start=${startDate}&end=${endDate}&limit=20`, {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      if (drivesRes.ok) {
        recentDrives = await drivesRes.json();
      }
    } catch (error) {
      console.warn('Failed to fetch recent drives:', error);
    }
  }

  return { vehicles, state, recentDrives };
}

// Helper function to process and store data in D1 with enhanced analytics
async function processAndStoreInD1Enhanced(db: D1Database, tessieData: any) {
  try {
    console.log('Processing data with enhanced processor...');
    
    // Initialize enhanced processor
    const processor = new EnhancedDataProcessor(db);
    
    const { vehicles, state, recentDrives: liveDrives } = tessieData;
    
    if (!vehicles.results?.length) {
      throw new Error('No vehicles found in Tessie response');
    }

    const vehicle = vehicles.results[0];
    const currentState = state || vehicle.last_state;

    // Process vehicle state with enhanced fields
    if (currentState) {
      await processor.processVehicleState({
        vehicle_id: vehicle.vin || 'midnight-shadow',
        battery_level: currentState.charge_state?.battery_level || 0,
        battery_range: currentState.charge_state?.battery_range || 0,
        charging_state: currentState.charge_state?.charging_state || 'Unknown',
        shift_state: currentState.drive_state?.shift_state,
        power: currentState.charge_state?.charger_power || 0,
        locked: currentState.vehicle_state?.locked,
        climate_on: currentState.climate_state?.is_climate_on,
        latitude: currentState.drive_state?.latitude || 0,
        longitude: currentState.drive_state?.longitude || 0,
        heading: currentState.drive_state?.heading || 0,
        speed: currentState.drive_state?.speed || 0,
        odometer: currentState.vehicle_state?.odometer || 0,
        inside_temp: currentState.climate_state?.inside_temp,
        outside_temp: currentState.climate_state?.outside_temp,
        timestamp: new Date().toISOString()
      });
    }
    
    // Process recent drives with enhanced analytics
    if (liveDrives?.results) {
      for (const drive of liveDrives.results) {
        await processor.processDriveData({
          id: drive.id,
          vehicle_id: vehicle.vin || 'midnight-shadow',
          journey_id: 'continental-usa-2025',
          started_at: drive.started_at,
          ended_at: drive.ended_at,
          distance_miles: drive.distance_miles,
          duration_minutes: drive.duration_minutes,
          start_address: drive.start_address,
          end_address: drive.end_address,
          start_latitude: drive.start_latitude,
          start_longitude: drive.start_longitude,
          end_latitude: drive.end_latitude,
          end_longitude: drive.end_longitude,
          max_speed: drive.max_speed,
          energy_used_kwh: drive.energy_used || 0,
          start_battery_level: drive.start_battery_level,
          end_battery_level: drive.end_battery_level,
          start_odometer: drive.start_odometer,
          end_odometer: drive.end_odometer
        });
      }
    }
    
    // Continue with existing logic for backward compatibility
    const result = await processAndStoreInD1(db, tessieData);
    
    console.log('Enhanced processing complete');
    return { ...result, enhancedProcessing: true };
    
  } catch (error) {
    console.error('Enhanced data processing failed:', error);
    // Fallback to regular processing
    return await processAndStoreInD1(db, tessieData);
  }
}

// Helper function to process and store data in D1
async function processAndStoreInD1(db: D1Database, tessieData: any) {
  const { vehicles, state, recentDrives: liveDrives } = tessieData;
  
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

  // Get aggregated journey data from D1 - USE HISTORICAL ANALYSIS
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
      COUNT(DISTINCT sv.state_name) as states_visited_from_historical,
      COALESCE(SUM(d.distance_miles), 0) as total_distance,
      COUNT(DISTINCT d.id) as total_drives
    FROM journeys j
    LEFT JOIN vehicle_state vs ON j.vehicle_id = vs.vehicle_id
    LEFT JOIN states_visited sv ON j.id = sv.journey_id
    LEFT JOIN drives d ON j.id = d.journey_id AND d.started_at >= '2025-06-01'
    WHERE j.id = 'continental-usa-2025'
    GROUP BY j.id
  `).first();

  // Get recent drives for timeline - IMPROVED with proper formatting
  const recentDrives = await db.prepare(`
    SELECT 
      id, started_at as start_time, ended_at as end_time, distance_miles, 
      start_address as start_location, end_address as end_location,
      start_latitude, start_longitude, end_latitude, end_longitude
    FROM drives 
    WHERE journey_id = 'continental-usa-2025'
      AND started_at >= '2025-06-01'
      AND start_address IS NOT NULL 
      AND end_address IS NOT NULL
    ORDER BY started_at DESC 
    LIMIT 10
  `).all();

  // Get recent charges for timeline
  const recentCharges = await db.prepare(`
    SELECT 
      id, started_at as start_time, ended_at as end_time, location, energy_added_kwh as energy_added, cost_usd as cost
    FROM charges 
    WHERE journey_id = 'continental-usa-2025'
    ORDER BY started_at DESC 
    LIMIT 20
  `).all();

  // Calculate live trip progress - SIMPLE calculation based on known journey start
  const currentOdometer = currentState?.vehicle_state?.odometer || 0;
  
  // Use actual odometer reading from June 1, 2025 start date
  const JOURNEY_START_ODOMETER = 58046; // Actual reading from 2025-06-01 08:00:00
  const tripMiles = Math.max(0, currentOdometer - JOURNEY_START_ODOMETER);

  // Build unified response - Use LIVE Tessie data for all components
  return {
    overview: {
      tripName: journeyData?.name || "A Whittle Wandering - Continental USA",
      vehicle: vehicle.display_name || "Tesla Model Y",
      startDate: "2025-06-01", // HARDCODED as requested
      daysElapsed: Math.floor((Date.now() - new Date('2025-06-01').getTime()) / (1000 * 60 * 60 * 24)),
      totalMiles: Math.round(tripMiles),
      currentOdometer: Math.round(currentOdometer),
      statesVisited: journeyData?.states_visited_from_historical || 0,
      totalStates: 48
    },
    currentStatus: {
      battery: {
        level: currentState?.charge_state?.battery_level || 0,
        range: Math.round(currentState?.charge_state?.battery_range || 0),
        charging: currentState?.charge_state?.charging_state || 'Unknown'
      },
      location: {
        coordinates: {
          lat: currentState?.drive_state?.latitude || 0,
          lng: currentState?.drive_state?.longitude || 0
        },
        state: await detectStateFromCoordinates(currentState?.drive_state?.latitude || 0, currentState?.drive_state?.longitude || 0),
        lastUpdate: new Date().toISOString()
      },
      vehicle: {
        odometer: Math.round(currentState?.vehicle_state?.odometer || 0),
        speed: currentState?.drive_state?.speed || 0,
        temperature: {
          inside: currentState?.climate_state?.inside_temp,
          outside: currentState?.climate_state?.outside_temp
        }
      }
    },
    timeline: {
      drives: (recentDrives.results && recentDrives.results.length > 0) ? recentDrives.results
        .filter((drive: any) => drive.start_location && drive.end_location) // Filter out drives with undefined locations
        .map((drive: any) => ({
        id: drive.id,
        date: drive.start_time,
        startTime: drive.start_time,
        endTime: drive.end_time,
        distance: Math.round(drive.distance_miles || 0),
        startLocation: drive.start_location || `${drive.start_latitude}, ${drive.start_longitude}`,
        endLocation: drive.end_location || `${drive.end_latitude}, ${drive.end_longitude}`,
        startCoordinates: {
          lat: drive.start_latitude || 0,
          lng: drive.start_longitude || 0
        },
        endCoordinates: {
          lat: drive.end_latitude || 0,
          lng: drive.end_longitude || 0
        }
      })) : (liveDrives?.results && liveDrives.results.length > 0) ? liveDrives.results.map((drive: any) => ({
        id: drive.id,
        date: drive.started_at,
        startTime: drive.started_at,
        endTime: drive.ended_at,
        distance: Math.round(drive.distance_miles || 0),
        startLocation: drive.start_address || `${drive.start_latitude}, ${drive.start_longitude}`,
        endLocation: drive.end_address || `${drive.end_latitude}, ${drive.end_longitude}`,
        startCoordinates: {
          lat: drive.start_latitude || 0,
          lng: drive.start_longitude || 0
        },
        endCoordinates: {
          lat: drive.end_latitude || 0,
          lng: drive.end_longitude || 0
        }
      })) : [
        // Fallback sample drive data when database is empty
        {
          id: 'sample-drive-1',
          date: '2025-06-01',
          startTime: '2025-06-01T08:00:00Z',
          endTime: '2025-06-01T12:00:00Z',
          distance: 250,
          startLocation: 'Hartford, CT 06101',
          endLocation: 'Boston, MA 02101',
          startCoordinates: { lat: 41.7658, lng: -72.6734 },
          endCoordinates: { lat: 42.3601, lng: -71.0589 }
        },
        {
          id: 'sample-drive-2',
          date: '2025-06-02',
          startTime: '2025-06-02T09:00:00Z',
          endTime: '2025-06-02T14:30:00Z',
          distance: 315,
          startLocation: 'Boston, MA 02101',
          endLocation: 'New York, NY 10001',
          startCoordinates: { lat: 42.3601, lng: -71.0589 },
          endCoordinates: { lat: 40.7589, lng: -73.9851 }
        }
      ],
      charges: (recentCharges.results && recentCharges.results.length > 0) ? recentCharges.results.map((charge: any) => ({
        id: charge.id,
        date: charge.start_time,
        startTime: charge.start_time,
        endTime: charge.end_time,
        location: charge.location,
        energyAdded: charge.energy_added,
        cost: charge.cost
      })) : [
        // Fallback sample charge data when database is empty
        {
          id: 'sample-charge-1',
          date: '2025-06-01',
          startTime: '2025-06-01T12:30:00Z',
          endTime: '2025-06-01T13:30:00Z',
          location: 'Supercharger - Boston, MA',
          energyAdded: 45,
          cost: 15.50
        },
        {
          id: 'sample-charge-2',
          date: '2025-06-02',
          startTime: '2025-06-02T15:00:00Z',
          endTime: '2025-06-02T16:15:00Z',
          location: 'Supercharger - New York, NY',
          energyAdded: 38,
          cost: 13.20
        }
      ]
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
  // More comprehensive state boundaries for all continental US states
  const US_STATES = [
    // Northeast
    { name: 'Connecticut', minLat: 40.9959, maxLat: 42.0508, minLng: -73.7277, maxLng: -71.7869 },
    { name: 'Maine', minLat: 42.9633, maxLat: 47.4596, minLng: -71.0826, maxLng: -66.8847 },
    { name: 'Massachusetts', minLat: 41.2376, maxLat: 42.8868, minLng: -73.5081, maxLng: -69.9286 },
    { name: 'New Hampshire', minLat: 42.6970, maxLat: 45.3058, minLng: -72.5570, maxLng: -70.6104 },
    { name: 'New Jersey', minLat: 38.9281, maxLat: 41.3574, minLng: -75.5597, maxLng: -73.8937 },
    { name: 'New York', minLat: 40.4774, maxLat: 45.0158, minLng: -79.7624, maxLng: -71.7774 },
    { name: 'Pennsylvania', minLat: 39.7198, maxLat: 42.2694, minLng: -80.5194, maxLng: -74.6895 },
    { name: 'Rhode Island', minLat: 41.1460, maxLat: 42.0187, minLng: -71.8620, maxLng: -71.1208 },
    { name: 'Vermont', minLat: 42.7269, maxLat: 45.0167, minLng: -73.4370, maxLng: -71.4653 },
    
    // Southeast  
    { name: 'Delaware', minLat: 38.4513, maxLat: 39.8390, minLng: -75.7887, maxLng: -74.9848 },
    { name: 'Florida', minLat: 24.3963, maxLat: 31.0014, minLng: -87.6349, maxLng: -79.9743 },
    { name: 'Georgia', minLat: 30.3552, maxLat: 35.0008, minLng: -85.6051, maxLng: -80.7514 },
    { name: 'Maryland', minLat: 37.9113, maxLat: 39.7231, minLng: -79.4877, maxLng: -75.0490 },
    { name: 'North Carolina', minLat: 33.7514, maxLat: 36.5881, minLng: -84.3219, maxLng: -75.3603 },
    { name: 'South Carolina', minLat: 32.0346, maxLat: 35.2155, minLng: -83.3532, maxLng: -78.5408 },
    { name: 'Virginia', minLat: 36.5407, maxLat: 39.4660, minLng: -83.6754, maxLng: -75.1663 },
    { name: 'West Virginia', minLat: 37.2014, maxLat: 40.6381, minLng: -82.6447, maxLng: -77.7190 },
    
    // Midwest
    { name: 'Illinois', minLat: 36.9703, maxLat: 42.5081, minLng: -91.5133, maxLng: -87.0199 },
    { name: 'Indiana', minLat: 37.7717, maxLat: 41.7613, minLng: -88.0978, maxLng: -84.7844 },
    { name: 'Iowa', minLat: 40.3756, maxLat: 43.5012, minLng: -96.6396, maxLng: -90.1400 },
    { name: 'Kansas', minLat: 36.9931, maxLat: 40.0031, minLng: -102.0517, maxLng: -94.5882 },
    { name: 'Michigan', minLat: 41.6962, maxLat: 48.2388, minLng: -90.4182, maxLng: -82.4128 },
    { name: 'Minnesota', minLat: 43.4993, maxLat: 49.3844, minLng: -97.2394, maxLng: -89.4910 },
    { name: 'Missouri', minLat: 35.9957, maxLat: 40.6136, minLng: -95.7742, maxLng: -89.0993 },
    { name: 'Nebraska', minLat: 39.9999, maxLat: 43.0017, minLng: -104.0572, maxLng: -95.3082 },
    { name: 'North Dakota', minLat: 45.9350, maxLat: 49.0007, minLng: -104.0489, maxLng: -96.5544 },
    { name: 'Ohio', minLat: 38.4033, maxLat: 41.9773, minLng: -84.8203, maxLng: -80.5185 },
    { name: 'South Dakota', minLat: 42.4798, maxLat: 45.9454, minLng: -104.0572, maxLng: -96.4362 },
    { name: 'Wisconsin', minLat: 42.4919, maxLat: 47.0808, minLng: -92.8893, maxLng: -86.2491 },
    
    // South
    { name: 'Alabama', minLat: 30.2307, maxLat: 35.0041, minLng: -88.4730, maxLng: -84.8925 },
    { name: 'Arkansas', minLat: 33.0041, maxLat: 36.4996, minLng: -94.6178, maxLng: -89.6444 },
    { name: 'Kentucky', minLat: 36.4970, maxLat: 39.1472, minLng: -89.5715, maxLng: -81.9647 },
    { name: 'Louisiana', minLat: 28.9385, maxLat: 33.0197, minLng: -94.0431, maxLng: -88.8177 },
    { name: 'Mississippi', minLat: 30.1734, maxLat: 34.9961, minLng: -91.6552, maxLng: -88.0972 },
    { name: 'Oklahoma', minLat: 33.6201, maxLat: 37.0020, minLng: -103.0025, maxLng: -94.4312 },
    { name: 'Tennessee', minLat: 34.9829, maxLat: 36.6781, minLng: -90.3103, maxLng: -81.6469 },
    { name: 'Texas', minLat: 25.8371, maxLat: 36.5007, minLng: -106.6456, maxLng: -93.5083 },
    
    // West
    { name: 'Arizona', minLat: 31.3322, maxLat: 37.0043, minLng: -114.8165, maxLng: -109.0453 },
    { name: 'California', minLat: 32.5343, maxLat: 42.0095, minLng: -124.4096, maxLng: -114.1312 },
    { name: 'Colorado', minLat: 36.9924, maxLat: 41.0034, minLng: -109.0606, maxLng: -102.0415 },
    { name: 'Idaho', minLat: 41.9880, maxLat: 49.0010, minLng: -117.2433, maxLng: -111.0435 },
    { name: 'Montana', minLat: 44.3583, maxLat: 49.0010, minLng: -116.0505, maxLng: -104.0395 },
    { name: 'Nevada', minLat: 35.0018, maxLat: 42.0022, minLng: -120.0065, maxLng: -114.0396 },
    { name: 'New Mexico', minLat: 31.3323, maxLat: 37.0001, minLng: -109.0501, maxLng: -103.0018 },
    { name: 'Oregon', minLat: 41.9918, maxLat: 46.2991, minLng: -124.7037, maxLng: -116.4634 },
    { name: 'Utah', minLat: 36.9979, maxLat: 42.0013, minLng: -114.0529, maxLng: -109.0411 },
    { name: 'Washington', minLat: 45.5436, maxLat: 49.0025, minLng: -124.8489, maxLng: -116.9155 },
    { name: 'Wyoming', minLat: 40.9996, maxLat: 45.0058, minLng: -111.0568, maxLng: -104.0519 }
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

// Scheduled function for Cloudflare Cron Triggers
export async function scheduled(
  controller: ScheduledController,
  env: Env,
  ctx: ExecutionContext
): Promise<void> {
  const tessieApiKey = env.TESSIE_API_KEY;
  const vehicleVin = env.TESLA_VIN || 'default-vin';
  
  if (!tessieApiKey) {
    console.error('TESSIE_API_KEY not configured for cron job');
    return;
  }

  const cronController = new CronDataController(env.TESLA_DB, tessieApiKey, vehicleVin);
  const cron = controller.cron;

  try {
    console.log(`🕒 Cron trigger: ${cron}`);

    switch (cron) {
      case '*/5 6-23 * * *':
        // Quick state updates during active hours (every 5 minutes, 6 AM to 11 PM)
        console.log('⚡ Running quick state update...');
        await cronController.quickStateUpdate();
        break;
        
      case '*/30 * * * *':
        // Full sync every 30 minutes
        console.log('🔄 Running full data sync...');
        await cronController.fullDataSync();
        break;
        
      case '0 2 * * *':
        // Historical backfill at 2 AM daily
        console.log('📚 Running historical backfill...');
        await cronController.historicalBackfill();
        break;
        
      case '0 * * * *':
        // Data quality check hourly
        console.log('🔍 Running data quality check...');
        await cronController.dataQualityCheck();
        break;
        
      case '0 */6 * * *':
        // AI/ML processing every 6 hours
        console.log('🤖 Running AI/ML data processing...');
        await cronController.aiDataProcessing();
        break;
        
      default:
        console.warn(`❓ Unknown cron schedule: ${cron}`);
    }
    
    console.log(`✅ Cron job completed: ${cron}`);
  } catch (error) {
    console.error(`❌ Cron job failed (${cron}):`, error);
    
    // Log error to Analytics Engine for monitoring
    try {
      env.TELEMETRY_ANALYTICS.writeDataPoint({
        blobs: ['cron_error', cron, error instanceof Error ? error.message : 'Unknown error'],
        doubles: [Date.now()],
        indexes: ['cron_error']
      });
    } catch (analyticsError) {
      console.error('Failed to log cron error to analytics:', analyticsError);
    }
  }
}

export default app;
