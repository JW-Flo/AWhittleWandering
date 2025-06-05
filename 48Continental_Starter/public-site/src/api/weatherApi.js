/**
 * weatherApi.js
 * Provides functions to load weather data through the backend API, using in-memory caching and deduplication.
 */
/* global fetch, URLSearchParams, console */
import { cachedRequest } from "./apiCache";

// Use environment variables with fallbacks for development
const API_BASE_URL = import.meta.env.VITE_EDGE_WORKER_URL || "/api";

export async function loadWeather(params) {
  // Construct the full URL with the /api prefix so that Vite’s proxy can forward the request.
  const url = `${API_BASE_URL}/weather?${new URLSearchParams(params)}`;
  try {
    const response = await fetch(url);
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Unexpected response format");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching weather data:", error);
    console.warn("Using simulated weather data due to API error");
    // Return simulated weather data as a fallback
    return {
      simulated: true,
      temperature: 25,
      condition: "Sunny",
      windSpeed: 10,
    };
  }
}
export const fetchWeatherData = loadWeather;

export async function getCachedWeather(params) {
  // Wrap the loadWeather call with caching via cachedRequest.
  return cachedRequest(
    () => loadWeather(params),
    `weather-${JSON.stringify(params)}`
  );
}

/**
 * Generates simulated weather data for testing or when the API is unavailable
 * @param {Object} options - Configuration options
 * @param {Object} options.location - Optional location coordinates
 * @returns {Object} Simulated weather data
 */
export function generateSimulatedWeatherData(options = {}) {
  const { location } = options;

  // Use some seed from location if available, otherwise random
  const randomSeed = location
    ? (location.latitude * 100 + location.longitude) % 100
    : Math.random() * 100;

  // Generate weather condition based on randomSeed
  let condition;
  if (randomSeed < 20) {
    condition = "Rainy";
  } else if (randomSeed < 30) {
    condition = "Cloudy";
  } else if (randomSeed < 40) {
    condition = "Partly Cloudy";
  } else {
    condition = "Sunny";
  }

  // Temperature between 60-95°F with some variability
  const temperature = Math.round(60 + (randomSeed / 100) * 35);

  // Wind speed between 0-20 mph
  const windSpeed = Math.round((randomSeed / 100) * 20);

  // Humidity between 30-90%
  const humidity = Math.round(30 + (randomSeed / 100) * 60);

  return {
    simulated: true,
    current: {
      temperature,
      condition,
      windSpeed,
      humidity,
      timestamp: new Date().toISOString(),
    },
    forecast: Array.from({ length: 5 }).map((_, i) => ({
      day: new Date(Date.now() + i * 86400000).toLocaleDateString("en-US", {
        weekday: "short",
      }),
      temperature: Math.round(temperature + (Math.random() * 10 - 5)),
      condition:
        Math.random() > 0.7
          ? condition
          : ["Sunny", "Rainy", "Cloudy", "Partly Cloudy"][
              Math.floor(Math.random() * 4)
            ],
      windSpeed: Math.round(windSpeed + (Math.random() * 6 - 3)),
      humidity: Math.round(humidity + (Math.random() * 10 - 5)),
    })),
  };
}
