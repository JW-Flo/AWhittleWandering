/**
 * Environment Variable Mapper
 * 
 * This utility standardizes environment variable names across different parts
 * of the 48 Continental USA application (frontend, backend, CI/CD).
 * 
 * It maps between different naming conventions:
 * - Frontend (Vite): VITE_EXAMPLE_KEY
 * - Backend: EXAMPLE_KEY
 * - GitHub Actions: Various names
 * 
 * USAGE:
 * 1. Import this file
 * 2. Use getEnv('STANDARD_VAR_NAME') - this will check all possible variations
 */

/* eslint-env browser, node */

// Environment variable standardization map
const ENV_MAPPINGS = {
  // MapBox configuration
  'MAPBOX_TOKEN': [
    'VITE_MAPBOX_TOKEN',       // Frontend (Vite)
    'MAPBOX_PUBLIC_TOKEN',     // MapBox util expected name
    'MAPBOX_TOKEN',            // Standard name
    'MAP_API_TOKEN'            // GitHub Actions
  ],

  // Weather API configuration
  'WEATHER_API_KEY': [
    'VITE_OPENWEATHER_API_KEY',  // Frontend (Vite)
    'OPENWEATHER_API_KEY',       // Standard backend name
    'OPEN_WEATHER_API_KEY'       // Alternative format in some services
  ],

  // Tessie API for Tesla vehicle data
  'TESSIE_TOKEN': [
    'VITE_TESSIE_TOKEN',
    'TESSIE_API_TOKEN',
    'TESLA_API_TOKEN'
  ],

  // Vehicle identification
  'VEHICLE_VIN': [
    'VITE_TESSIE_VIN',
    'TESLA_VIN',
    'VEHICLE_VIN'
  ],

  // Edge worker configuration
  'EDGE_WORKER_URL': [
    'VITE_EDGE_WORKER_URL',
    'EDGE_WORKER_ENDPOINT',
    'WORKER_URL'
  ],

  // API configuration
  'API_BASE_URL': [
    'VITE_API_BASE_URL',
    'API_ENDPOINT',
    'API_URL'
  ],

  // WebSocket configuration
  'WEBSOCKET_ENDPOINT': [
    'VITE_WEBSOCKET_ENDPOINT',
    'WS_ENDPOINT',
    'WEBSOCKET_URL'
  ],

  // Feature flags
  'ENABLE_STREAMING': [
    'VITE_ENABLE_STREAMING',
    'STREAMING_ENABLED',
    'ENABLE_STREAMING'
  ],

  'USE_SIMULATED_DATA': [
    'VITE_USE_SIMULATED_DATA',
    'SIMULATION_MODE',
    'USE_SIMULATED_DATA'
  ]
};

/**
 * Get an environment variable by its standardized name
 * 
 * @param {string} standardName - The standard name of the environment variable
 * @param {string} defaultValue - Default value if not found
 * @returns {string} The value of the environment variable or defaultValue
 */
function getEnv(standardName, defaultValue = '') {
  if (!ENV_MAPPINGS[standardName]) {
    console.warn(`Unknown environment variable: ${standardName}`);
    return defaultValue;
  }

  // Try to find the variable in all possible places
  for (const varName of ENV_MAPPINGS[standardName]) {
    // Check browser environment (Vite)
    try {
      if (typeof window !== 'undefined' && 
          typeof import.meta !== 'undefined' && 
          import.meta.env && 
          import.meta.env[varName]) {
        return import.meta.env[varName];
      }
    } catch (e) {
      // Ignore import.meta errors in Node environment
    }

    // Check Node.js environment
    try {
      if (typeof process !== 'undefined' && 
          process.env && 
          process.env[varName]) {
        return process.env[varName];
      }
    } catch (e) {
      // Ignore process.env errors in browser environment
    }

    // Check for window.ENV (sometimes used for injecting env vars)
    try {
      if (typeof window !== 'undefined' && 
          window.ENV && 
          window.ENV[varName]) {
        return window.ENV[varName];
      }
    } catch (e) {
      // Ignore window.ENV errors
    }
  }

  return defaultValue;
}

module.exports = {
  getEnv,
  ENV_MAPPINGS
};

// If using ES modules
export {
  getEnv,
  ENV_MAPPINGS
};

// Default export
export default {
  getEnv,
  ENV_MAPPINGS
};
