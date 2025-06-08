/**
 * Environment Configuration Utility
 *
 * This utility provides a centralized way to access environment variables
 * throughout the application, with consistent naming and fallbacks.
 *
 * It handles the different naming conventions between environments:
 * - Frontend variables with VITE_ prefix
 * - Backend variables without prefix
 * - GitHub secret names that may have different naming
 */

/* eslint-env browser, node */

// Map of standardized variable names to their various environment sources
const ENV_VARIABLE_MAP = {
  // MapBox configuration
  MAPBOX_TOKEN: {
    // Sources in order of preference
    sources: [
      "import.meta.env.VITE_MAPBOX_TOKEN", // Frontend (Vite)
      "process.env.MAPBOX_PUBLIC_TOKEN", // Backend/build scripts
      "process.env.MAP_API_TOKEN", // GitHub Actions secrets
    ],
    required: true,
    description: "MapBox API token for map rendering",
  },

  // Weather API configuration
  WEATHER_API_KEY: {
    sources: [
      "import.meta.env.VITE_OPENWEATHER_API_KEY", // Frontend (Vite)
      "process.env.OPENWEATHER_API_KEY", // Backend standard format
      "process.env.OPEN_WEATHER_API_KEY", // Alternative format used in some services
    ],
    required: true,
    description: "OpenWeatherMap API key",
  },

  // Other environment variables can be added here following the same pattern...
};

/**
 * Gets an environment variable with consistent naming and fallbacks
 *
 * @param {string} key - The standardized environment variable name
 * @param {string} [defaultValue=''] - Default value if not found
 * @returns {string} The environment variable value or default
 */
export const getEnvironmentVariable = (key, defaultValue = "") => {
  if (!ENV_VARIABLE_MAP[key]) {
    console.warn(`Unknown environment variable: ${key}`);
    return defaultValue;
  }

  const config = ENV_VARIABLE_MAP[key];

  // Try each source in order of preference
  for (const source of config.sources) {
    try {
      // Handle import.meta.env variables (client-side)
      if (source.startsWith("import.meta.env.")) {
        const envKey = source.split(".")[3];
        if (import.meta.env[envKey]) {
          return import.meta.env[envKey];
        }
      }
      // Handle process.env variables (server-side or build-time)
      else if (
        source.startsWith("process.env.") &&
        typeof process !== "undefined"
      ) {
        const envKey = source.split(".")[2];
        if (process.env[envKey]) {
          return process.env[envKey];
        }
      }
    } catch (err) {
      // Skip errors when accessing undefined objects (like process in browser)
    }
  }

  // If required and not found, log an error
  if (config.required && defaultValue === "") {
    console.error(`Required environment variable not found: ${key}`);
    console.error(`Description: ${config.description}`);
    console.error("Sources checked:", config.sources.join(", "));
  }

  return defaultValue;
};

/**
 * Gets the Mapbox token from available environment sources
 * @returns {string} Mapbox token or empty string if not found
 */
export const getMapboxToken = () => {
  // First try to get from meta tag (if in browser)
  if (typeof document !== "undefined") {
    const metaToken = document
      .querySelector('meta[name="mapbox-token"]')
      ?.getAttribute("content");
    if (metaToken) return metaToken;
  }

  // Fall back to environment variables
  return getEnvironmentVariable("MAPBOX_TOKEN");
};

/**
 * Gets the OpenWeatherMap API key from available environment sources
 * @returns {string} OpenWeatherMap API key or empty string if not found
 */
export const getWeatherApiKey = () => {
  return getEnvironmentVariable("WEATHER_API_KEY");
};

export default {
  getEnvironmentVariable,
  getMapboxToken,
  getWeatherApiKey,
};
