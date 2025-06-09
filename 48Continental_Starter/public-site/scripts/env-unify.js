// Unified environment variable usage for Mapbox and Weather tokens
// This script ensures all relevant tokens are available for tests and runtime

process.env.VITE_MAPBOX_TOKEN =
  process.env.VITE_MAPBOX_TOKEN || process.env.MAPBOX_TOKEN || "pk.test-token";
process.env.OPENWEATHER_API_KEY =
  process.env.OPENWEATHER_API_KEY ||
  process.env.VITE_OPENWEATHER_API_KEY ||
  "test-weather-key";
process.env.VITE_OPENWEATHER_API_KEY =
  process.env.VITE_OPENWEATHER_API_KEY ||
  process.env.OPENWEATHER_API_KEY ||
  "test-weather-key";

// ...existing code...
