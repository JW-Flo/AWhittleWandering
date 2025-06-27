/**
 * A Whittle Wandering Edge Worker
 * Handles API requests for vehicle data, weather, and trip information
 */

import { AgentMessagingDurableObject } from "./agentMessagingDurableObject";

// Centralized version constant
const API_VERSION = "1.0.0";
const APP_START_TIMESTAMP_MS = 1640995200000;

import { AgentMessagingDurableObject } from "./agentMessagingDurableObject";

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
            version: API_VERSION,
            status: "healthy",
            timestamp: new Date().toISOString(),
            version: "1.0.0",
          }),
          {
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

          name: "A Whittle Wandering API",
          version: API_VERSION,
          endpoints: [
          name: "A Whittle Wandering API",
          version: "1.0.0",
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
 * Generate simulated vehicle data
 */
function generateSimulatedVehicleData() {
  const now = new Date();
  const timeOfDay = now.getHours();

  // Simulate current location: somewhere in Texas (from the screenshot)
  const baseLatitude = 27.741777; // Corpus Christi, TX
  const baseLongitude = -97.388844;

  // Add some random movement
  const latitude = baseLatitude + (Math.random() - 0.5) * 0.1;
  const longitude = baseLongitude + (Math.random() - 0.5) * 0.1;

  // Battery level varies throughout the day
  let batteryLevel;
  if (timeOfDay >= 6 && timeOfDay <= 8) {
    batteryLevel = 85 + Math.random() * 10; // Morning charge
  } else if (timeOfDay >= 12 && timeOfDay <= 14) {
    batteryLevel = 60 + Math.random() * 25; // Midday
  } else if (timeOfDay >= 18 && timeOfDay <= 22) {
    batteryLevel = 70 + Math.random() * 25; // Evening
  } else {
    batteryLevel = 30 + Math.random() * 40; // Night/early morning
  }

  // Speed varies by time of day
  let speed = 0;
  if (timeOfDay >= 7 && timeOfDay <= 19) {
    speed = 45 + Math.random() * 35; // 45-80 mph during day
  }

  const isCharging = batteryLevel < 40 && speed === 0;

  return {
    id: "wandering-whittle-tesla",
    name: "The Wandering Whittle",
    model: "Model Y Long Range",
    batteryLevel: Math.round(batteryLevel),
    range: Math.round(batteryLevel * 3.5),
    speed: Math.round(speed),
    power: isCharging
      ? -(50 + Math.random() * 150)
      : speed > 0
      ? 15 + Math.random() * 25
      : 0,
    charging: isCharging,
    location: {
      latitude: latitude,
      longitude: longitude,
      heading: Math.round(Math.random() * 360),
    },
    temperature: {
      inside: 72,
      outside: 68 + Math.round((Math.random() - 0.5) * 20),
    },
    climate: {
      enabled: true,
      temperature: 72,
    },
    locked: !isCharging && speed === 0,
    sentry_mode: speed === 0 && !isCharging,
    odometer: 15420 + Math.round(Math.random() * 100),
    last_updated: new Date().toISOString(),
  };
}

/**
 * Generate simulated weather data
 */
function generateSimulatedWeatherData(lat, lon) {
  const conditions = ["clear", "clouds", "rain", "snow", "thunderstorm"];
  const condition = conditions[Math.floor(Math.random() * conditions.length)];

  return {
    location: {
      latitude: lat,
      longitude: lon,
      city: "Current Location",
      state: "TX",
    },
    current: {
      temperature: 68 + Math.round((Math.random() - 0.5) * 30),
      condition: condition,
      humidity: 40 + Math.round(Math.random() * 40),
      wind_speed: Math.round(Math.random() * 20),
      wind_direction: Math.round(Math.random() * 360),
      visibility: 10,
      uv_index: Math.round(Math.random() * 10),
    },
    forecast: generateWeatherForecast(),
    last_updated: new Date().toISOString(),
  };
}

/**
 * Generate weather forecast
 */
function generateWeatherForecast() {
  const forecast = [];
  for (let i = 0; i < 5; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);

    forecast.push({
      date: date.toISOString().split("T")[0],
      high: 70 + Math.round(Math.random() * 20),
      low: 50 + Math.round(Math.random() * 20),
      condition: ["clear", "clouds", "rain"][Math.floor(Math.random() * 3)],
      precipitation: Math.round(Math.random() * 100),
    });
  }
  return forecast;
}

/**
 * Generate simulated trip data
 */
function generateSimulatedTripData() {
  return {
    trip_id: "wandering-whittle-2025",
    name: "The Wandering Whittle - 48 States Road Trip",
    start_date: "2025-06-01T00:00:00Z",
    end_date: "2025-08-01T23:59:59Z",
    current_state: "Texas",
    states_visited: [
      "California",
      "Nevada",
      "Utah",
      "Colorado",
      "New Mexico",
      "Texas",
    ],
    states_remaining: 42,
    total_distance: 15420,
    distance_remaining: 8000,
    progress_percentage: 35,
    next_destination: {
      city: "Austin",
      state: "Texas",
      arrival_estimate: "2025-06-28T15:00:00Z",
    },
    last_updated: new Date().toISOString(),
  };
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
