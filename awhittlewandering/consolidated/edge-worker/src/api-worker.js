/**
 * A Whittle Wandering Edge Worker
 * Handles API requests for vehicle data, weather, and trip information
 */

import { AgentMessagingDurableObject } from "./agentMessagingDurableObject";
import {
  generateSimulatedVehicleData,
  generateSimulatedWeatherData,
  generateWeatherForecast,
  generateSimulatedTripData,
  generateSimulatedChargingData,
} from "./apiHandlers";

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
            version: "1.0.0",
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
    uptime: Date.now() - 1640995200000, // Approximate uptime
  };

  return new Response(JSON.stringify(status), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

// (Removed: now imported from ./apiHandlers)

export { AgentMessagingDurableObject };
