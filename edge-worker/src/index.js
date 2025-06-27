/**
 * A Whittle Wandering Edge Worker
 * Handles API requests for vehicle data, weather, and trip information
 */

import { AgentMessagingDurableObject } from "./agentMessagingDurableObject";

// Centralized version constant
const API_VERSION = "1.0.0";
const APP_START_TIMESTAMP_MS = 1640995200000;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Set CORS headers for all responses
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, x-signature",
    };

    // Handle preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      // Agent messaging routes
      if (url.pathname.startsWith("/agent-messaging")) {
        const id = env.AGENT_MESSAGING_DO.idFromName("agent-messaging");
        const obj = env.AGENT_MESSAGING_DO.get(id);
        const response = await obj.fetch(request);

        // Add CORS headers to response
        const newResponse = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: { ...response.headers, ...corsHeaders },
        });
        return newResponse;
      }

      // API routes
      if (url.pathname.startsWith("/api/")) {
        return handleApiRequest(request, env, url, corsHeaders);
      }

      // Health check
      if (url.pathname === "/health") {
        return new Response(
          JSON.stringify({
            status: "healthy",
            timestamp: new Date().toISOString(),
            version: API_VERSION,
          }),
          {
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      // Default route - serve a simple API info page
      if (url.pathname === "/") {
        const apiInfo = {
          name: "A Whittle Wandering API",
          version: API_VERSION,
          endpoints: [
            "/api/vehicle - Get current vehicle data",
            "/api/weather - Get current weather data",
            "/api/trip - Get trip information",
            "/api/charging - Get charging station data",
            "/health - Health check",
          ],
          timestamp: new Date().toISOString(),
        };

        return new Response(JSON.stringify(apiInfo, null, 2), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // 404 for unknown routes
      return new Response("Not Found", {
        status: 404,
        headers: corsHeaders,
      });
    } catch (error) {
      console.error("Edge Worker Error:", error);
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: error.message,
          timestamp: new Date().toISOString(),
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
  },
};

/**
 * Handle API requests
 */
async function handleApiRequest(request, env, url, corsHeaders) {
  const path = url.pathname.replace("/api", "");

  switch (path) {
    case "/vehicle":
      return handleVehicleData(request, env, corsHeaders);
    case "/weather":
      return handleWeatherData(request, env, url, corsHeaders);
    case "/trip":
      return handleTripData(request, env, corsHeaders);
    case "/charging":
      return handleChargingData(request, env, url, corsHeaders);
    case "/status":
      return handleApiStatus(request, env, corsHeaders);
    default:
      return new Response(
        JSON.stringify({
          error: "Endpoint not found",
          available_endpoints: [
            "/vehicle",
            "/weather",
            "/trip",
            "/charging",
            "/status",
          ],
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
  }
}

/**
 * Handle vehicle data requests
 */
async function handleVehicleData(request, env, corsHeaders) {
  try {
    // Simulate realistic Tesla data for now
    // In production, this would call the Tessie API
    const vehicleData = generateSimulatedVehicleData();

    return new Response(JSON.stringify(vehicleData), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Failed to fetch vehicle data",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
}

/**
 * Handle weather data requests
 */
async function handleWeatherData(request, env, url, corsHeaders) {
  try {
    const params = url.searchParams;
    const lat = params.get("lat") || "37.7749";
    const lon = params.get("lon") || "-122.4194";

    // Simulate weather data
    // In production, this would call OpenWeatherMap API
    const weatherData = generateSimulatedWeatherData(
      parseFloat(lat),
      parseFloat(lon)
    );

    return new Response(JSON.stringify(weatherData), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Failed to fetch weather data",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
}

/**
 * Handle trip data requests
 */
async function handleTripData(request, env, corsHeaders) {
  try {
    // Simulate trip progress data
    const tripData = generateSimulatedTripData();

    return new Response(JSON.stringify(tripData), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Failed to fetch trip data",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
}

/**
 * Handle charging station data requests
 */
async function handleChargingData(request, env, url, corsHeaders) {
  try {
    const params = url.searchParams;
    const lat = params.get("lat") || "37.7749";
    const lon = params.get("lon") || "-122.4194";
    const radius = params.get("radius") || "50";

    // Simulate charging station data
    const chargingData = generateSimulatedChargingData(
      parseFloat(lat),
      parseFloat(lon),
      parseInt(radius)
    );

    return new Response(JSON.stringify(chargingData), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Failed to fetch charging data",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
}

/**
 * Handle API status requests
 */
async function handleApiStatus(request, env, corsHeaders) {
  const status = {
    api: "operational",
    services: {
      vehicle: "operational",
      weather: "operational",
      trip: "operational",
      charging: "operational",
    },
    timestamp: new Date().toISOString(),
    uptime: Date.now() - APP_START_TIMESTAMP_MS, // Approximate uptime since 2022-01-01T00:00:00Z
  };

  return new Response(JSON.stringify(status), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

/**
 * Fetch real vehicle data from Tessie API or Tesla Fleet API
 * @returns {Promise<Object>} Vehicle data object
 */
async function fetchVehicleData() {
  try {
    // TODO: Implement real Tesla API integration
    // This should call Tessie API or Tesla Fleet API
    const response = await fetch('https://api.tessie.com/vehicles', {
      headers: {
        'Authorization': `Bearer ${TESSIE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Tesla API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      id: data.id,
      name: data.display_name,
      model: data.vehicle_config?.car_type || "Tesla Model Y",
      batteryLevel: data.charge_state?.battery_level || 0,
      range: data.charge_state?.est_battery_range || 0,
      speed: data.drive_state?.speed || 0,
      power: data.charge_state?.charger_power || 0,
      charging: data.charge_state?.charging_state === "Charging",
      location: {
        latitude: data.drive_state?.latitude || 0,
        longitude: data.drive_state?.longitude || 0,
        heading: data.drive_state?.heading || 0,
      },
      temperature: {
        inside: data.climate_state?.inside_temp || 20,
        outside: data.climate_state?.outside_temp || 20,
      },
      climate: {
        enabled: data.climate_state?.is_climate_on || false,
        temperature: data.climate_state?.driver_temp_setting || 20,
      },
      locked: data.vehicle_state?.locked || true,
      sentry_mode: data.vehicle_state?.sentry_mode || false,
      odometer: data.vehicle_state?.odometer || 0,
      last_updated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to fetch vehicle data:', error);
    throw new Error('Unable to retrieve vehicle data');
  }
}

/**
 * Fetch real weather data from OpenWeatherMap API
 * @param {number} lat - Latitude coordinate
 * @param {number} lon - Longitude coordinate  
 * @returns {Promise<Object>} Weather data object
 */
async function fetchWeatherData(lat, lon) {
  try {
    const API_KEY = process.env.OPENWEATHER_API_KEY;
    if (!API_KEY) {
      throw new Error('OpenWeatherMap API key not configured');
    }

    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=imperial`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=imperial`;

    const [currentResponse, forecastResponse] = await Promise.all([
      fetch(currentWeatherUrl),
      fetch(forecastUrl)
    ]);

    if (!currentResponse.ok || !forecastResponse.ok) {
      throw new Error('Failed to fetch weather data from OpenWeatherMap');
    }

    const currentData = await currentResponse.json();
    const forecastData = await forecastResponse.json();

    return {
      location: {
        latitude: lat,
        longitude: lon,
        city: currentData.name,
        state: currentData.sys?.country || "US",
      },
      current: {
        temperature: Math.round(currentData.main.temp),
        condition: currentData.weather[0]?.main?.toLowerCase() || "clear",
        humidity: currentData.main.humidity,
        wind_speed: Math.round(currentData.wind?.speed || 0),
        wind_direction: currentData.wind?.deg || 0,
        visibility: Math.round((currentData.visibility || 10000) / 1000),
        uv_index: 0, // Requires separate API call
      },
      forecast: forecastData.list.slice(0, 5).map(item => ({
        date: new Date(item.dt * 1000).toISOString().split("T")[0],
        high: Math.round(item.main.temp_max),
        low: Math.round(item.main.temp_min),
        condition: item.weather[0]?.main?.toLowerCase() || "clear",
        precipitation: Math.round((item.pop || 0) * 100),
      })),
      last_updated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to fetch weather data:', error);
    throw new Error('Unable to retrieve weather data');
  }
}

/**
 * Fetch real trip data from database or trip management system
 * @returns {Promise<Object>} Trip data object
 */
async function fetchTripData() {
  try {
    // TODO: Implement database integration for trip tracking
    // This should connect to your trip management database
    const response = await fetch(`${TRIP_API_BASE_URL}/current-trip`, {
      headers: {
        'Authorization': `Bearer ${TRIP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Trip API error: ${response.status}`);
    }

    const tripData = await response.json();

    return {
      trip_id: tripData.id,
      name: tripData.name,
      start_date: tripData.start_date,
      end_date: tripData.end_date,
      current_state: tripData.current_location?.state,
      states_visited: tripData.states_completed || [],
      states_remaining: 48 - (tripData.states_completed?.length || 0),
      total_distance: tripData.total_miles || 0,
      distance_remaining: tripData.remaining_miles || 0,
      progress_percentage: tripData.completion_percentage || 0,
      next_destination: {
        city: tripData.next_stop?.city,
        state: tripData.next_stop?.state,
        arrival_estimate: tripData.next_stop?.eta,
      },
      last_updated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to fetch trip data:', error);
    throw new Error('Unable to retrieve trip data');
  }
}

/**
 * Generate simulated charging station data
 */
function generateSimulatedChargingData(lat, lon, radius) {
  const stations = [];
  const stationNames = [
    "Tesla Supercharger",
    "Electrify America",
    "ChargePoint",
    "EVgo",
    "Blink",
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
        address: `${Math.floor(Math.random() * 9999)} Main St, Anytown, TX`,
      },
      connectors: [
        {
          type: "Tesla Supercharger",
          power: 150 + Math.floor(Math.random() * 100),
          available: Math.floor(Math.random() * 8),
          total: 8,
        },
      ],
      distance: Math.round(Math.random() * radius),
      status: Math.random() > 0.1 ? "operational" : "maintenance",
    });
  }

  return {
    stations: stations,
    total_count: stations.length,
    search_radius: radius,
    center: { latitude: lat, longitude: lon },
    last_updated: new Date().toISOString(),
  };
}

export { AgentMessagingDurableObject };
