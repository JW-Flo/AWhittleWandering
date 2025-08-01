import { Hono } from 'hono';
import { cors } from 'hono/cors';

// Cloudflare Worker types
interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

interface R2Bucket {
  get(key: string): Promise<R2Object | null>;
  put(key: string, value: ReadableStream | ArrayBuffer | string, options?: {
    httpMetadata?: {
      contentType?: string;
      cacheControl?: string;
    };
  }): Promise<void>;
}

interface R2Object {
  body: ReadableStream;
}

interface Env {
  UNIFIED_DATA_CACHE: KVNamespace;
  MEDIA_BUCKET: R2Bucket;
  TESSIE_API_KEY: string;
  OPENWEATHER_API_KEY: string;
  JWT_SECRET: string;
  ADMIN_PASSWORD: string;
}

const app = new Hono<{ Bindings: Env }>();

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

// Rate limiting middleware (simple in-memory approach)
const rateLimiter = new Map<string, { count: number; reset: number }>();

app.use('*', async (c, next) => {
  const ip = c.req.header('CF-Connecting-IP') || 'unknown';
  const now = Date.now();
  const windowMs = 10000; // 10 seconds
  const maxRequests = 20; // per window

  const entry = rateLimiter.get(ip);
  if (!entry || now > entry.reset) {
    rateLimiter.set(ip, { count: 1, reset: now + windowMs });
  } else {
    entry.count++;
    if (entry.count > maxRequests) {
      return c.json({ error: 'Rate limit exceeded' }, 429);
    }
  }

  await next();
});

// Health check endpoint
app.get('/api/v1/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: Date.now(),
    version: '2.0.0',
    service: 'A Whittle Wandering Unified API'
  });
});

// Legacy health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: Date.now(),
    version: '2.0.0',
    service: 'A Whittle Wandering Unified API'
  });
});

// Unified data endpoint - main API endpoint
app.get('/api/v1/unified-data', async (c) => {
  try {
    const tessieApiKey = c.env.TESSIE_API_KEY;
    if (!tessieApiKey) {
      return c.json({ error: 'Tessie API key not configured' }, 500);
    }

    // Check for cached data first
    const cacheKey = 'UNIFIED_DATA_CACHE';
    const cachedData = await c.env.UNIFIED_DATA_CACHE.get(cacheKey);
    
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      const cacheAge = Date.now() - parsed.timestamp;
      
      // Return cached data if less than 30 seconds old
      if (cacheAge < 30000) {
        console.log('Returning cached unified data');
        return c.json(parsed.data);
      }
    }

    console.log('Fetching fresh data from Tessie API');

    // Fetch vehicles
    const vehiclesResponse = await fetch('https://api.tessie.com/vehicles', {
      headers: { Authorization: `Bearer ${tessieApiKey}` }
    });

    if (!vehiclesResponse.ok) {
      throw new Error(`Tessie API error: ${vehiclesResponse.status}`);
    }

    const vehicles = await vehiclesResponse.json();
    if (!vehicles.results || vehicles.results.length === 0) {
      throw new Error('No vehicles found');
    }

    const vehicle = vehicles.results[0];
    const vin = vehicle.vin;

    // Fetch current vehicle state
    const stateResponse = await fetch(`https://api.tessie.com/${vin}/state`, {
      headers: { Authorization: `Bearer ${tessieApiKey}` }
    });

    if (!stateResponse.ok) {
      throw new Error(`Vehicle state API error: ${stateResponse.status}`);
    }

    const state = await stateResponse.json();

    // Fetch recent drives and charges
    const fromTimestamp = Math.floor(new Date('2025-06-01').getTime() / 1000);
    const toTimestamp = Math.floor(Date.now() / 1000);

    const [drivesResponse, chargesResponse] = await Promise.all([
      fetch(`https://api.tessie.com/${vin}/drives?from=${fromTimestamp}&to=${toTimestamp}`, {
        headers: { Authorization: `Bearer ${tessieApiKey}` }
      }),
      fetch(`https://api.tessie.com/${vin}/charges?from=${fromTimestamp}&to=${toTimestamp}`, {
        headers: { Authorization: `Bearer ${tessieApiKey}` }
      })
    ]);

    const drives = drivesResponse.ok ? await drivesResponse.json() : { results: [] };
    const charges = chargesResponse.ok ? await chargesResponse.json() : { results: [] };

    // Calculate journey statistics
    const journeyStartDate = new Date('2025-06-01');
    const currentDate = new Date();
    const daysElapsed = Math.floor((currentDate.getTime() - journeyStartDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const totalMiles = drives.results?.reduce((sum: number, drive: any) => 
      sum + (drive.odometer_distance || 0), 0) || 0;

    // Extract unique states from drive locations
    const statesVisited = new Set<string>();
    drives.results?.forEach((drive: any) => {
      if (drive.starting_location) {
        const startState = extractStateFromLocation(drive.starting_location);
        if (startState) statesVisited.add(startState);
      }
      if (drive.ending_location) {
        const endState = extractStateFromLocation(drive.ending_location);
        if (endState) statesVisited.add(endState);
      }
    });

    // Build unified payload
    const unifiedData = {
      overview: {
        tripName: "A Whittle Wandering - 48 Continental States",
        vehicle: vehicle.last_state?.display_name || "Tesla Model Y",
        startDate: "2025-06-01",
        daysElapsed,
        totalMiles: Math.round(totalMiles),
        statesVisited: statesVisited.size,
        totalStates: 48
      },
      currentStatus: {
        battery: {
          level: state.charge_state?.battery_level || 0,
          range: Math.round(state.charge_state?.battery_range || 0),
          charging: state.charge_state?.charging_state || 'Disconnected'
        },
        location: {
          coordinates: {
            lat: state.drive_state?.latitude || 0,
            lng: state.drive_state?.longitude || 0
          },
          city: "Vehicle Location", // TODO: Add reverse geocoding service
          state: detectStateFromCoordinates(
            state.drive_state?.latitude || 0, 
            state.drive_state?.longitude || 0
          )?.name || "Location Unavailable",
          lastUpdate: new Date().toISOString()
        },
        vehicle: {
          odometer: Math.round(state.vehicle_state?.odometer || 0),
          speed: state.drive_state?.speed || 0,
          heading: state.drive_state?.heading || 0,
          temperature: {
            inside: state.climate_state?.inside_temp,
            outside: state.climate_state?.outside_temp
          }
        }
      },
      timeline: {
        drives: drives.results?.slice(-20).map((drive: any) => ({
          id: drive.id,
          date: new Date(drive.started_at * 1000).toISOString(),
          startLocation: drive.starting_location,
          endLocation: drive.ending_location,
          distance: drive.odometer_distance,
          duration: drive.ended_at - drive.started_at,
          energyUsed: drive.energy_used
        })) || [],
        charges: charges.results?.slice(-20).map((charge: any) => ({
          id: charge.id,
          date: new Date(charge.started_at * 1000).toISOString(),
          location: charge.location,
          energyAdded: charge.energy_added,
          duration: charge.ended_at - charge.started_at
        })) || []
      },
      liveData: {
        timestamp: Date.now(),
        vehicleState: state,
        recentActivity: {
          lastDrive: drives.results?.[drives.results.length - 1],
          lastCharge: charges.results?.[charges.results.length - 1]
        }
      },
      tessieStatus: {
        connected: true,
        lastUpdate: new Date().toISOString(),
        dataFreshness: "live"
      }
    };

    // Cache the result
    await c.env.UNIFIED_DATA_CACHE.put(cacheKey, JSON.stringify({
      data: unifiedData,
      timestamp: Date.now()
    }), { expirationTtl: 300 }); // 5 minute TTL

    return c.json(unifiedData);

  } catch (error) {
    console.error('Error fetching unified data:', error);
    
    // Try to return cached data on error
    const cacheKey = 'UNIFIED_DATA_CACHE';
    const cachedData = await c.env.UNIFIED_DATA_CACHE.get(cacheKey);
    
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      parsed.data.tessieStatus = {
        connected: false,
        lastUpdate: new Date(parsed.timestamp).toISOString(),
        dataFreshness: "cached",
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      return c.json(parsed.data);
    }

    return c.json({
      error: 'Failed to fetch data and no cache available',
      tessieStatus: {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }, 500);
  }
});

// Media upload endpoint
app.post('/api/v1/media/upload', async (c) => {
  try {
    // Check authentication
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    // Verify JWT token
    const token = authHeader.substring(7);
    const isValidToken = await verifyJWT(token, c.env.JWT_SECRET);
    if (!isValidToken) {
      return c.json({ error: 'Invalid authorization token' }, 401);
    }

    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const state = formData.get('state') as string;
    const metadata = formData.get('metadata') as string;

    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    // Generate unique key
    const fileId = crypto.randomUUID();
    const extension = file.name.split('.').pop() || '';
    const objectKey = `${fileId}.${extension}`;

    // Upload to R2
    await c.env.MEDIA_BUCKET.put(objectKey, file.stream(), {
      httpMetadata: {
        contentType: file.type,
        cacheControl: 'public, max-age=31536000'
      }
    });

    // Store metadata in KV
    const mediaMetadata = {
      id: fileId,
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      state: state || 'unknown',
      metadata: metadata ? JSON.parse(metadata) : {},
      uploadedAt: new Date().toISOString(),
      objectKey
    };

    await c.env.UNIFIED_DATA_CACHE.put(`media:${fileId}`, JSON.stringify(mediaMetadata));

    return c.json({
      success: true,
      mediaId: fileId,
      url: `/media/${fileId}`,
      metadata: mediaMetadata
    });

  } catch (error) {
    console.error('Media upload error:', error);
    return c.json({ 
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Media retrieval endpoint
app.get('/media/:key', async (c) => {
  try {
    const key = c.req.param('key');
    
    // Get metadata from KV
    const metadataJson = await c.env.UNIFIED_DATA_CACHE.get(`media:${key}`);
    if (!metadataJson) {
      return c.json({ error: 'Media not found' }, 404);
    }

    const metadata = JSON.parse(metadataJson);
    
    // Get file from R2
    const object = await c.env.MEDIA_BUCKET.get(metadata.objectKey);
    if (!object) {
      return c.json({ error: 'File not found in storage' }, 404);
    }

    // Stream the file back
    return new Response(object.body, {
      headers: {
        'Content-Type': metadata.mimeType,
        'Cache-Control': 'public, max-age=31536000',
        'Content-Length': metadata.size.toString()
      }
    });

  } catch (error) {
    console.error('Media retrieval error:', error);
    return c.json({ error: 'Failed to retrieve media' }, 500);
  }
});

// Authentication endpoint
app.post('/api/v1/auth/login', async (c) => {
  try {
    const { username, password } = await c.req.json();
    
    // Use secure password hashing in production
    const hashedPassword = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password + 'salt'));
    const expectedHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(c.env.ADMIN_PASSWORD + 'salt'));
    
    // Compare hashed passwords securely
    const passwordMatch = await crypto.subtle.verify(
      'HMAC',
      await crypto.subtle.importKey('raw', new TextEncoder().encode(c.env.JWT_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']),
      new Uint8Array(hashedPassword),
      new Uint8Array(expectedHash)
    ).catch(() => false);
    
    if (username === 'admin' && passwordMatch) {
      // Generate secure JWT token
      const header = { alg: 'HS256', typ: 'JWT' };
      const payload = { 
        sub: 'admin', 
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      };
      
      const token = await generateJWT(header, payload, c.env.JWT_SECRET);
      
      return c.json({
        success: true,
        token,
        expiresIn: '24h'
      });
    }

    return c.json({ error: 'Invalid credentials' }, 401);
    
  } catch (error) {
    return c.json({ error: 'Authentication failed' }, 500);
  }
});

// Helper function to detect state from coordinates
interface StateBoundary {
  name: string;
  abbreviation: string;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

const US_STATE_BOUNDARIES: StateBoundary[] = [
  { name: 'Alabama', abbreviation: 'AL', minLat: 30.2336, maxLat: 35.0041, minLng: -88.4734, maxLng: -84.8882 },
  { name: 'Alaska', abbreviation: 'AK', minLat: 51.2097, maxLat: 71.5388, minLng: -179.1506, maxLng: -129.9795 },
  { name: 'Arizona', abbreviation: 'AZ', minLat: 31.3322, maxLat: 37.0043, minLng: -114.8165, maxLng: -109.0452 },
  { name: 'Arkansas', abbreviation: 'AR', minLat: 33.0041, maxLat: 36.4996, minLng: -94.6178, maxLng: -89.6449 },
  { name: 'California', abbreviation: 'CA', minLat: 32.5343, maxLat: 42.0095, minLng: -124.4096, maxLng: -114.1308 },
  { name: 'Colorado', abbreviation: 'CO', minLat: 36.9924, maxLat: 41.0034, minLng: -109.0489, maxLng: -102.0424 },
  { name: 'Connecticut', abbreviation: 'CT', minLat: 40.9959, maxLat: 42.0508, minLng: -73.7277, maxLng: -71.7869 },
  { name: 'Delaware', abbreviation: 'DE', minLat: 38.4491, maxLat: 39.8394, minLng: -75.7890, maxLng: -75.0489 },
  { name: 'Florida', abbreviation: 'FL', minLat: 24.3963, maxLat: 31.0009, minLng: -87.6349, maxLng: -79.9740 },
  { name: 'Georgia', abbreviation: 'GA', minLat: 30.3552, maxLat: 35.0008, minLng: -85.6051, maxLng: -80.7519 },
  { name: 'Hawaii', abbreviation: 'HI', minLat: 18.9100, maxLat: 28.4017, minLng: -178.3347, maxLng: -154.8066 },
  { name: 'Idaho', abbreviation: 'ID', minLat: 41.9880, maxLat: 49.0011, minLng: -117.2431, maxLng: -111.0435 },
  { name: 'Illinois', abbreviation: 'IL', minLat: 36.9703, maxLat: 42.5089, minLng: -91.5130, maxLng: -87.0198 },
  { name: 'Indiana', abbreviation: 'IN', minLat: 37.7717, maxLat: 41.7613, minLng: -88.0972, maxLng: -84.7847 },
  { name: 'Iowa', abbreviation: 'IA', minLat: 40.3755, maxLat: 43.5012, minLng: -96.6397, maxLng: -90.1401 },
  { name: 'Kansas', abbreviation: 'KS', minLat: 36.9930, maxLat: 40.0031, minLng: -102.0517, maxLng: -94.5882 },
  { name: 'Kentucky', abbreviation: 'KY', minLat: 36.4971, maxLat: 39.1472, minLng: -89.5714, maxLng: -81.9649 },
  { name: 'Louisiana', abbreviation: 'LA', minLat: 28.8609, maxLat: 33.0194, minLng: -94.0432, maxLng: -88.7578 },
  { name: 'Maine', abbreviation: 'ME', minLat: 42.9179, maxLat: 47.4598, minLng: -71.0842, maxLng: -66.8854 },
  { name: 'Maryland', abbreviation: 'MD', minLat: 37.9118, maxLat: 39.7229, minLng: -79.4877, maxLng: -75.0489 },
  { name: 'Massachusetts', abbreviation: 'MA', minLat: 41.2376, maxLat: 42.8868, minLng: -73.5081, maxLng: -69.9286 },
  { name: 'Michigan', abbreviation: 'MI', minLat: 41.6960, maxLat: 48.2388, minLng: -90.4182, maxLng: -82.1221 },
  { name: 'Minnesota', abbreviation: 'MN', minLat: 43.4999, maxLat: 49.3844, minLng: -97.2394, maxLng: -89.4917 },
  { name: 'Mississippi', abbreviation: 'MS', minLat: 30.1734, maxLat: 34.9961, minLng: -91.6549, maxLng: -88.0977 },
  { name: 'Missouri', abbreviation: 'MO', minLat: 35.9957, maxLat: 40.6136, minLng: -95.7742, maxLng: -89.0988 },
  { name: 'Montana', abbreviation: 'MT', minLat: 44.3583, maxLat: 49.0011, minLng: -116.0489, maxLng: -104.0397 },
  { name: 'Nebraska', abbreviation: 'NE', minLat: 39.9999, maxLat: 43.0017, minLng: -104.0533, maxLng: -95.3080 },
  { name: 'Nevada', abbreviation: 'NV', minLat: 35.0018, maxLat: 42.0022, minLng: -120.0064, maxLng: -114.0396 },
  { name: 'New Hampshire', abbreviation: 'NH', minLat: 42.6970, maxLat: 45.3055, minLng: -72.5570, maxLng: -70.6103 },
  { name: 'New Jersey', abbreviation: 'NJ', minLat: 38.9281, maxLat: 41.3574, minLng: -75.5597, maxLng: -73.8937 },
  { name: 'New Mexico', abbreviation: 'NM', minLat: 31.3328, maxLat: 37.0002, minLng: -109.0502, maxLng: -103.0020 },
  { name: 'New York', abbreviation: 'NY', minLat: 40.4774, maxLat: 45.0158, minLng: -79.7624, maxLng: -71.7774 },
  { name: 'North Carolina', abbreviation: 'NC', minLat: 33.7514, maxLat: 36.5881, minLng: -84.3218, maxLng: -75.4001 },
  { name: 'North Dakota', abbreviation: 'ND', minLat: 45.9350, maxLat: 49.0011, minLng: -104.0489, maxLng: -96.5544 },
  { name: 'Ohio', abbreviation: 'OH', minLat: 38.4037, maxLat: 41.9773, minLng: -84.8203, maxLng: -80.5183 },
  { name: 'Oklahoma', abbreviation: 'OK', minLat: 33.6159, maxLat: 37.0020, minLng: -103.0025, maxLng: -94.4312 },
  { name: 'Oregon', abbreviation: 'OR', minLat: 41.9918, maxLat: 46.2991, minLng: -124.7038, maxLng: -116.4635 },
  { name: 'Pennsylvania', abbreviation: 'PA', minLat: 39.7198, maxLat: 42.5159, minLng: -80.5190, maxLng: -74.6895 },
  { name: 'Rhode Island', abbreviation: 'RI', minLat: 41.1460, maxLat: 42.0187, minLng: -71.8620, maxLng: -71.1208 },
  { name: 'South Carolina', abbreviation: 'SC', minLat: 32.0346, maxLat: 35.2154, minLng: -83.3532, maxLng: -78.4991 },
  { name: 'South Dakota', abbreviation: 'SD', minLat: 42.4799, maxLat: 45.9454, minLng: -104.0578, maxLng: -96.4367 },
  { name: 'Tennessee', abbreviation: 'TN', minLat: 34.9829, maxLat: 36.6782, minLng: -90.3103, maxLng: -81.6469 },
  { name: 'Texas', abbreviation: 'TX', minLat: 25.8371, maxLat: 36.5007, minLng: -106.6456, maxLng: -93.5084 },
  { name: 'Utah', abbreviation: 'UT', minLat: 36.9979, maxLat: 42.0013, minLng: -114.0524, maxLng: -109.0413 },
  { name: 'Vermont', abbreviation: 'VT', minLat: 42.7269, maxLat: 45.0067, minLng: -73.4540, maxLng: -71.4653 },
  { name: 'Virginia', abbreviation: 'VA', minLat: 36.5407, maxLat: 39.4660, minLng: -83.6753, maxLng: -75.1657 },
  { name: 'Washington', abbreviation: 'WA', minLat: 45.5437, maxLat: 49.0024, minLng: -124.8489, maxLng: -116.9158 },
  { name: 'West Virginia', abbreviation: 'WV', minLat: 37.2015, maxLat: 40.6385, minLng: -82.6447, maxLng: -77.7190 },
  { name: 'Wisconsin', abbreviation: 'WI', minLat: 42.4919, maxLat: 47.3098, minLng: -92.8892, maxLng: -86.2479 },
  { name: 'Wyoming', abbreviation: 'WY', minLat: 40.9979, maxLat: 45.0018, minLng: -111.0567, maxLng: -104.0525 },
];

function detectStateFromCoordinates(lat: number, lng: number): StateBoundary | null {
  return US_STATE_BOUNDARIES.find(state => 
    lat >= state.minLat && 
    lat <= state.maxLat && 
    lng >= state.minLng && 
    lng <= state.maxLng
  ) || null;
}

// Helper function to extract state from location string
function extractStateFromLocation(location: string): string | null {
  const statePatterns = [
    /,\s*([A-Z]{2})\s*\d{5}/,  // ", CA 90210"
    /,\s*([A-Za-z\s]+)\s*\d{5}/, // ", California 90210"
    /,\s*([A-Za-z\s]+)$/,      // ", California"
  ];
  
  for (const pattern of statePatterns) {
    const match = location.match(pattern);
    if (match) {
      const state = match[1].trim();
      return state.length === 2 ? state : stateNameToAbbr(state);
    }
  }
  
  return null;
}

// Helper function to convert state names to abbreviations
function stateNameToAbbr(stateName: string): string {
  const states: { [key: string]: string } = {
    'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
    'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
    'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
    'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
    'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
    'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
    'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
    'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
    'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
    'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY'
  };
  
  return states[stateName] || stateName;
}

// Helper function to generate JWT tokens
async function generateJWT(header: any, payload: any, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  
  const encodedHeader = btoa(JSON.stringify(header)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  
  const data = `${encodedHeader}.${encodedPayload}`;
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  
  return `${data}.${encodedSignature}`;
}

// Helper function to verify JWT tokens
async function verifyJWT(token: string, secret: string): Promise<boolean> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    const [header, payload, signature] = parts;
    const data = `${header}.${payload}`;
    
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const signatureBytes = Uint8Array.from(atob(signature.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    
    const isValid = await crypto.subtle.verify('HMAC', key, signatureBytes, encoder.encode(data));
    
    if (!isValid) return false;
    
    // Check token expiration
    const decodedPayload = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    const now = Math.floor(Date.now() / 1000);
    
    return decodedPayload.exp > now;
  } catch {
    return false;
  }
}

// Legacy endpoints for backward compatibility
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
    title: 'A Whittle Wandering Unified API',
    description: '48 Continental US Tesla Road Trip Tracking API with live Tessie integration',
    version: '2.0.0',
    endpoints: {
      'GET /api/v1/health': 'API health check',
      'GET /api/v1/unified-data': 'Main unified data endpoint with live Tessie data',
      'POST /api/v1/media/upload': 'Upload media files (requires auth)',
      'GET /media/:key': 'Retrieve media files',
      'POST /api/v1/auth/login': 'Admin authentication',
      'GET /api/v1/trip/status': 'Legacy trip status endpoint',
      'GET /api/v1/trip': 'Legacy trip endpoint',
      'GET /api/docs': 'This documentation'
    },
    authentication: {
      'admin': 'Use POST /api/v1/auth/login to get bearer token',
      'media_upload': 'Requires Authorization: Bearer <token> header'
    }
  });
});

// Catch-all route
app.all('*', (c) => {
  return c.json({
    error: 'Route not found',
    available_endpoints: [
      'GET /api/v1/health',
      'GET /api/v1/unified-data',
      'POST /api/v1/media/upload',
      'GET /media/:key',
      'POST /api/v1/auth/login',
      'GET /api/v1/trip/status',
      'GET /api/v1/trip',
      'GET /api/docs'
    ]
  }, 404);
});

export default app;
