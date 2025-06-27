/**
 * A Whittle Wandering Edge Worker
 * Handles API requests for vehicle data, weather, and trip information
 */

import { AgentMessagingDurableObject } from './agentMessagingDurableObject';

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);
    
    // Set CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-signature',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      // Agent messaging routes
      if (url.pathname.startsWith('/agent-messaging')) {
        const id = env.AGENT_MESSAGING_DO.idFromName('agent-messaging');
        const obj = env.AGENT_MESSAGING_DO.get(id);
        const response = await obj.fetch(request);
        
        // Add CORS headers to response
        const newResponse = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: { ...response.headers, ...corsHeaders }
        });
        return newResponse;
      }

      // API routes
      if (url.pathname.startsWith('/api/')) {
        return handleApiRequest(request, env, url, corsHeaders);
      }

      // Health check
      if (url.pathname === '/health') {
        return new Response(JSON.stringify({ 
          status: 'healthy', 
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Default route - serve a simple API info page
      if (url.pathname === '/') {
        const apiInfo = {
          name: 'A Whittle Wandering API',
          version: '1.0.0',
          endpoints: [
            '/api/vehicle - Get current vehicle data',
            '/api/weather - Get current weather data',
            '/api/trip - Get trip information',
            '/api/charging - Get charging station data',
            '/health - Health check'
          ],
          timestamp: new Date().toISOString()
        };
        
        return new Response(JSON.stringify(apiInfo, null, 2), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // 404 for unknown routes
      return new Response('Not Found', { 
        status: 404, 
        headers: corsHeaders 
      });

    } catch (error) {
      console.error('Edge Worker Error:', error);
      return new Response(JSON.stringify({ 
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }
};

/**
 * Handle API requests
 */
async function handleApiRequest(request: Request, env: any, url: URL, corsHeaders: Record<string, string>): Promise<Response> {
  const path = url.pathname.replace('/api', '');

  switch (path) {
    case '/vehicle':
      return handleVehicleData(request, env, corsHeaders);
    case '/weather':
      return handleWeatherData(request, env, url, corsHeaders);
    case '/trip':
      return handleTripData(request, env, corsHeaders);
    case '/charging':
      return handleChargingData(request, env, url, corsHeaders);
    case '/status':
      return handleApiStatus(request, env, corsHeaders);
    default:
      return new Response(JSON.stringify({ 
        error: 'Endpoint not found',
        available_endpoints: ['/vehicle', '/weather', '/trip', '/charging', '/status']
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
  }
}

/**
 * Handle vehicle data requests
 */
async function handleVehicleData(request: Request, env: any, corsHeaders: Record<string, string>): Promise<Response> {
  try {
    // Simulate realistic Tesla data for now
    // In production, this would call the Tessie API
    const vehicleData = generateSimulatedVehicleData();
    
    return new Response(JSON.stringify(vehicleData), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch vehicle data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

/**
 * Handle weather data requests
 */
async function handleWeatherData(request: Request, env: any, url: URL, corsHeaders: Record<string, string>): Promise<Response> {
  try {
    const params = url.searchParams;
    const lat = params.get('lat') || '37.7749';
    const lon = params.get('lon') || '-122.4194';
    
    // Simulate weather data
    // In production, this would call OpenWeatherMap API
    const weatherData = generateSimulatedWeatherData(parseFloat(lat), parseFloat(lon));
    
    return new Response(JSON.stringify(weatherData), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch weather data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

/**
 * Handle trip data requests
 */
async function handleTripData(request: Request, env: any, corsHeaders: Record<string, string>): Promise<Response> {
  try {
    // Simulate trip progress data
    const tripData = generateSimulatedTripData();
    
    return new Response(JSON.stringify(tripData), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch trip data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

/**
 * Handle charging station data requests
 */
async function handleChargingData(request: Request, env: any, url: URL, corsHeaders: Record<string, string>): Promise<Response> {
  try {
    const params = url.searchParams;
    const lat = params.get('lat') || '37.7749';
    const lon = params.get('lon') || '-122.4194';
    const radius = params.get('radius') || '50';
    
    // Simulate charging station data
    const chargingData = generateSimulatedChargingData(
      parseFloat(lat), 
      parseFloat(lon), 
      parseInt(radius)
    );
    
    return new Response(JSON.stringify(chargingData), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch charging data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

/**
 * Handle API status requests
 */
async function handleApiStatus(request: Request, env: any, corsHeaders: Record<string, string>): Promise<Response> {
  const status = {
    api: 'operational',
    services: {
      vehicle: 'operational',
      weather: 'operational', 
      trip: 'operational',
      charging: 'operational'
    },
    timestamp: new Date().toISOString(),
    uptime: Date.now() - 1640995200000 // Approximate uptime
  };
  
  return new Response(JSON.stringify(status), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

/**
 * Generate simulated vehicle data based on actual trip status
 */
function generateSimulatedVehicleData(): any {
  const now = new Date();
  const timeOfDay = now.getHours();
  
  // Current location: Pocatello, ID heading to Farr West, UT
  const baseLatitude = 42.8713; // Pocatello, ID
  const baseLongitude = -112.4455;
  
  // Add slight movement along I-15 South towards Utah
  const tripProgress = (Math.random() * 0.02); // Small movement south
  const latitude = baseLatitude - tripProgress; // Moving south
  const longitude = baseLongitude + (Math.random() - 0.5) * 0.01; // Minor east/west variance
  
  // Current battery level around 93% as stated
  const batteryLevel = 91 + Math.random() * 4; // 91-95% range
  
  // Speed varies - currently traveling
  let speed = 0;
  if (timeOfDay >= 6 && timeOfDay <= 22) {
    speed = 65 + Math.random() * 15; // 65-80 mph on I-15
  }
  
  const isCharging = false; // Currently driving, not charging
  
  return {
    id: "wandering-whittle-tesla",
    name: "The Wandering Whittle",
    model: "Model Y Long Range",
    batteryLevel: Math.round(batteryLevel),
    range: Math.round(batteryLevel * 3.3), // More realistic range calculation
    speed: Math.round(speed),
    power: speed > 0 ? 18 + Math.random() * 12 : 0, // Power consumption while driving
    charging: isCharging,
    location: {
      latitude: latitude,
      longitude: longitude,
      heading: 195, // Heading southwest on I-15 towards Utah
    },
    temperature: {
      inside: 72,
      outside: 48 + Math.round(Math.random() * 15), // Idaho/Utah weather in late June
    },
    climate: {
      enabled: true,
      temperature: 72,
    },
    locked: false, // Unlocked while driving
    sentry_mode: false, // Off while driving
    odometer: 62000 + Math.round(Math.random() * 50), // Around 62k miles as stated
    last_updated: new Date().toISOString(),
    // Additional trip context
    trip_context: {
      current_leg: "Pocatello, ID → Farr West, UT",
      next_stop: "Farr West, UT",
      final_destination: "Provo, UT",
      estimated_arrival: "2025-06-27T21:30:00Z"
    }
  };
}

/**
 * Generate simulated weather data for current location
 */
function generateSimulatedWeatherData(lat: number, lon: number): any {
  // Weather appropriate for Idaho/Utah region in late June
  const conditions = ['clear', 'partly-cloudy', 'sunny'];
  const condition = conditions[Math.floor(Math.random() * conditions.length)];
  
  return {
    location: {
      latitude: lat,
      longitude: lon,
      city: "Pocatello",
      state: "ID"
    },
    current: {
      temperature: 75 + Math.round((Math.random() - 0.5) * 20), // Idaho summer weather
      condition: condition,
      humidity: 25 + Math.round(Math.random() * 30), // Dry western climate
      wind_speed: Math.round(Math.random() * 15),
      wind_direction: Math.round(Math.random() * 360),
      visibility: 10,
      uv_index: 7 + Math.round(Math.random() * 3) // High UV in mountain west
    },
    forecast: generateWeatherForecast(),
    last_updated: new Date().toISOString()
  };
}

/**
 * Generate weather forecast
 */
function generateWeatherForecast(): any[] {
  const forecast = [];
  for (let i = 0; i < 5; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    
    forecast.push({
      date: date.toISOString().split('T')[0],
      high: 70 + Math.round(Math.random() * 20),
      low: 50 + Math.round(Math.random() * 20),
      condition: ['clear', 'clouds', 'rain'][Math.floor(Math.random() * 3)],
      precipitation: Math.round(Math.random() * 100)
    });
  }
  return forecast;
}

/**
 * Generate simulated trip data reflecting actual journey
 */
function generateSimulatedTripData(): any {
  return {
    trip_id: "wandering-whittle-2025",
    name: "The Wandering Whittle - 48 States Road Trip",
    start_date: "2025-06-01T00:00:00Z",
    end_date: "2025-08-01T23:59:59Z",
    current_state: "Idaho",
    current_location: "Pocatello, ID",
    states_visited: [
      "California", "Nevada", "Utah", "Idaho", "Montana", "Wyoming", 
      "Colorado", "Nebraska", "South Dakota", "North Dakota"
    ],
    states_remaining: 38,
    total_distance_so_far: 8500, // More realistic for this stage of trip
    estimated_total_distance: 25000,
    progress_percentage: 34,
    current_leg: {
      from: "Pocatello, ID",
      to: "Farr West, UT",
      distance_remaining: 45,
      estimated_arrival: "2025-06-27T20:15:00Z"
    },
    next_destination: {
      city: "Provo",
      state: "Utah", 
      arrival_estimate: "2025-06-27T21:30:00Z"
    },
    trip_stats: {
      days_elapsed: 26,
      days_remaining: 34,
      average_miles_per_day: 327
    },
    last_updated: new Date().toISOString()
  };
}

/**
 * Generate simulated charging station data
 */
function generateSimulatedChargingData(lat: number, lon: number, radius: number): any {
  const stations = [];
  const stationNames = [
    "Tesla Supercharger",
    "Electrify America", 
    "ChargePoint",
    "EVgo",
    "Blink"
  ];
  
  for (let i = 0; i < 5; i++) {
    // Generate random locations within radius
    const randomLat = lat + (Math.random() - 0.5) * (radius / 69); // Rough conversion
    const randomLon = lon + (Math.random() - 0.5) * (radius / 69);
    
    stations.push({
      id: `station_${i + 1}`,
      name: stationNames[Math.floor(Math.random() * stationNames.length)],
      location: {
        latitude: randomLat,
        longitude: randomLon,
        address: `${Math.floor(Math.random() * 9999)} Main St, Anytown, TX`
      },
      connectors: [
        {
          type: "Tesla Supercharger",
          power: 150 + Math.floor(Math.random() * 100),
          available: Math.floor(Math.random() * 8),
          total: 8
        }
      ],
      distance: Math.round(Math.random() * radius),
      status: Math.random() > 0.1 ? 'operational' : 'maintenance'
    });
  }
  
  return {
    stations: stations,
    total_count: stations.length,
    search_radius: radius,
    center: { latitude: lat, longitude: lon },
    last_updated: new Date().toISOString()
  };
}

export { AgentMessagingDurableObject };
