/**
 * MapBox Configuration for The Wandering Whittle
 * 
 * Centralizes all MapBox tokens, style URLs, and configuration settings.
 * Always uses environment variables to ensure tokens are not hardcoded.
 */

// Define types for environment variables
declare global {
  interface ImportMeta {
    env: {
      VITE_MAPBOX_TOKEN?: string;
      [key: string]: string | undefined;
    }
  }
}

// Simple environment helper
const getEnv = (key: string, defaultValue: string | null = null): string | null => {
  try {
    // For Vite environment (client-side)
    // @ts-ignore - This is for Vite environment variables
    const value = import.meta?.env?.[key];
    return value !== undefined ? value : defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

/**
 * MapBox access token management
 */
export const getMapboxToken = (): string => {
  // For client-side applications
  if (typeof window !== 'undefined') {
    // Try to get from meta tag first (best practice for browser security)
    const metaToken = document.querySelector('meta[name="mapbox-token"]')?.getAttribute('content');
    if (metaToken) return metaToken;
  }
  
  // Use the environment mapper to get the token from any possible source
  return getEnv('MAPBOX_TOKEN', '');
};

/**
 * Map styles with light/dark variants
 */
export const mapStyles = {
  // Base styles
  light: 'mapbox://styles/mapbox/light-v11',
  dark: 'mapbox://styles/mapbox/dark-v11',
  satellite: 'mapbox://styles/mapbox/satellite-v9',
  streets: 'mapbox://styles/mapbox/streets-v12',
  outdoors: 'mapbox://styles/mapbox/outdoors-v12',
  
  // Custom 48 Continental styles (to be created in MapBox Studio)
  continental: {
    light: 'mapbox://styles/mapbox/light-v11', // Replace with custom style
    dark: 'mapbox://styles/mapbox/dark-v11'    // Replace with custom style
  }
};

/**
 * API endpoints
 */
export const endpoints = {
  // Base URLs
  geocoding: 'https://api.mapbox.com/geocoding/v5/mapbox.places',
  directions: 'https://api.mapbox.com/directions/v5/mapbox',
  matrix: 'https://api.mapbox.com/directions-matrix/v1/mapbox',
  static: 'https://api.mapbox.com/styles/v1',
  weather: 'https://api.mapbox.com/weather/v1',
  
  // Default parameters
  params: {
    geocoding: {
      limit: 5,
      country: 'us', // Default for 48 Continental
      types: 'place,region', // Default for city and state searches
      language: 'en'
    },
    directions: {
      profile: 'driving-traffic', // Default profile for Tesla
      geometries: 'geojson',
      steps: true,
      overview: 'full',
      annotations: 'duration,distance,speed',
      language: 'en'
    },
    weather: {
      hourly: 'temperature,precipitation,wind_speed',
      daily: 'weather_code,temperature,precipitation_sum',
      current: 'temperature,wind,precipitation,cloud_cover'
    }
  }
};

/**
 * Rate limiting configuration
 * Implements token bucket algorithm for API rate limiting
 */
export const rateLimits = {
  geocoding: { perMinute: 300, maxBurst: 60 },
  directions: { perMinute: 300, maxBurst: 60 },
  matrix: { perMinute: 300, maxBurst: 60 },
  static: { perMinute: 600, maxBurst: 60 },
  weather: { perMinute: 300, maxBurst: 60 }
};

/**
 * Caching configuration
 * TTL (Time To Live) in milliseconds
 */
export const cacheTTL = {
  geocoding: 24 * 60 * 60 * 1000, // 24 hours
  directions: 15 * 60 * 1000,     // 15 minutes
  weather: 30 * 60 * 1000,        // 30 minutes
  staticMaps: 24 * 60 * 60 * 1000 // 24 hours
};

export default {
  getMapboxToken,
  mapStyles,
  endpoints,
  rateLimits,
  cacheTTL
};
