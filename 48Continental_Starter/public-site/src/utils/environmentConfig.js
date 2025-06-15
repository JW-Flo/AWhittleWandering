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
    sources: [
      "import.meta.env.VITE_MAPBOX_TOKEN", // Frontend (Vite)
      "import.meta.env.MAPBOX_TOKEN", // fallback for legacy
      "process.env.MAPBOX_TOKEN", // Node env
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
      "import.meta.env.OPENWEATHER_API_KEY", // fallback for legacy
      "process.env.VITE_OPENWEATHER_API_KEY", // Node env
      "process.env.OPENWEATHER_API_KEY", // Backend standard format
      "process.env.OPEN_WEATHER_API_KEY", // Alt legacy
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
 * Uses a robust, fault-tolerant approach with multiple redundant sources
 * and guaranteed fallback mechanism
 * 
 * @returns {string} Mapbox token or hardcoded fallback
 */
export const getMapboxToken = () => {
  let token = null;
  const sources = [];

  try {
    // First priority: directly access the environment variable that was statically replaced by Vite
    // This should always be available if Vite build is configured correctly
    if (import.meta.env.VITE_MAPBOX_TOKEN) {
      token = import.meta.env.VITE_MAPBOX_TOKEN;
      sources.push('VITE_MAPBOX_TOKEN');
    }

    // Second priority: meta tag in HTML (if in browser)
    // This is always available in production if HTML is properly configured
    if (!token && typeof document !== "undefined") {
      const metaToken = document
        .querySelector('meta[name="mapbox-token"]')
        ?.getAttribute("content");
      if (metaToken) {
        token = metaToken;
        sources.push('meta[name="mapbox-token"]');
      }
    }

    // Third priority: window global set in the HTML
    // This provides a JS-based alternative to meta tags
    if (!token && typeof window !== "undefined" && window.__MAPBOX_TOKEN__) {
      token = window.__MAPBOX_TOKEN__;
      sources.push('window.__MAPBOX_TOKEN__');
    }

    // Fourth priority: If mapboxgl is already loaded and has a token
    if (!token && typeof window !== "undefined" && 
        window.mapboxgl && window.mapboxgl.accessToken) {
      token = window.mapboxgl.accessToken;
      sources.push('mapboxgl.accessToken');
    }

    // Final fallback: hardcoded token that's guaranteed to work
    // This ensures map always loads, even if all other methods fail
    if (!token || !token.startsWith('pk.')) {
      token = "pk.eyJ1IjoiaGFyZHdvcmtjbyIsImEiOiJjbWJteHA0cjYwYXRjMm1weGgwdnk5YWw2In0.0Bj4LWRpeefn0qPj_2VHcA";
      sources.push('HARDCODED_FALLBACK');
    }

    // Diagnostic logging in development
    if (import.meta.env.DEV || (typeof window !== "undefined" && window.__MAP_DEBUG__)) {
      console.log(`[MapboxToken] Retrieved from: ${sources.join(' -> ')}`);
    }

  } catch (error) {
    // Ultra-safe fallback - never let this function throw an error
    console.error('[MapboxToken] Error retrieving token:', error);
    token = "pk.eyJ1IjoiaGFyZHdvcmtjbyIsImEiOiJjbWJteHA0cjYwYXRjMm1weGgwdnk5YWw2In0.0Bj4LWRpeefn0qPj_2VHcA";
  }
  
  return token;
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
