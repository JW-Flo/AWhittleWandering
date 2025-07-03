/**
 * Weather Cache Module
 * 
 * Handles OpenWeather API requests with intelligent caching
 * - 15-minute cache for weather data
 * - KV fallback for stale data
 * - Rate limiting and error handling
 */

import { Env } from '../packages/shared/types';

export interface WeatherData {
  latitude: number;
  longitude: number;
  timestamp: number;
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  visibility: number;
  uvIndex: number;
}

export interface WeatherResponse {
  data: WeatherData | null;
  fresh: boolean;
  age: number;
  error?: string;
}

export async function handleWeatherRequest(request: Request, env: Env): Promise<Response> {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  if (request.method !== 'GET') {
    return errorResponse('Method not allowed', 405);
  }

  const url = new URL(request.url);
  const lat = url.searchParams.get('lat');
  const lon = url.searchParams.get('lon');

  if (!lat || !lon) {
    return errorResponse('Missing required parameters: lat, lon', 400);
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);

  if (isNaN(latitude) || isNaN(longitude)) {
    return errorResponse('Invalid coordinates', 400);
  }

  try {
    const weather = await getWeatherData(latitude, longitude, env);
    
    return new Response(JSON.stringify(weather), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': weather.fresh ? 'max-age=300' : 'max-age=60, stale-while-revalidate=300'
      }
    });
  } catch (error) {
    console.error('Weather API error:', error);
    
    return errorResponse('Weather data unavailable', 503);
  }
}

async function getWeatherData(lat: number, lon: number, env: Env): Promise<WeatherResponse> {
  const cacheKey = `weather:${Math.round(lat * 100) / 100}:${Math.round(lon * 100) / 100}`;
  const now = Date.now();

  // Try cache first
  try {
    const cache = (caches as any).default;
    const cachedResponse = await cache.match(cacheKey);
    
    if (cachedResponse) {
      const cachedData = await cachedResponse.json() as WeatherResponse;
      const age = now - cachedData.data!.timestamp;
      
      // Use cached data if less than 15 minutes old
      if (age < 900000) { // 15 minutes
        return {
          ...cachedData,
          age: age
        };
      }
    }
  } catch (error) {
    console.error('Cache read error:', error);
  }

  // Try to fetch fresh data
  try {
    const freshData = await fetchFromOpenWeather(lat, lon, env);
    
    if (freshData) {
      // Cache the fresh data
      await cacheWeatherData(cacheKey, freshData);
      
      return {
        data: freshData,
        fresh: true,
        age: 0
      };
    }
  } catch (error) {
    console.error('OpenWeather API error:', error);
    
    // Try KV fallback
    const kvData = await getKVFallback(cacheKey, env);
    if (kvData) {
      return kvData;
    }
  }

  // No data available
  return {
    data: null,
    fresh: false,
    age: 0,
    error: 'weather_unavailable'
  };
}

async function fetchFromOpenWeather(lat: number, lon: number, env: Env): Promise<WeatherData | null> {
  if (!env.OPENWEATHER_API_KEY) {
    throw new Error('OpenWeather API key not configured');
  }

  const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&appid=${env.OPENWEATHER_API_KEY}&units=imperial&exclude=minutely,hourly,daily,alerts`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'AWhittleWandering/1.0'
    }
  });

  if (!response.ok) {
    throw new Error(`OpenWeather API error: ${response.status}`);
  }

  const data = await response.json() as any;

  return {
    latitude: lat,
    longitude: lon,
    timestamp: Date.now(),
    temperature: data.current.temp,
    description: data.current.weather[0].description,
    humidity: data.current.humidity,
    windSpeed: data.current.wind_speed,
    windDirection: data.current.wind_deg,
    visibility: data.current.visibility,
    uvIndex: data.current.uvi
  };
}

async function cacheWeatherData(key: string, data: WeatherData): Promise<void> {
  try {
    const cache = (caches as any).default;
    const response = new Response(JSON.stringify({
      data: data,
      fresh: true,
      age: 0
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=900' // 15 minutes
      }
    });

    await cache.put(key, response);
  } catch (error) {
    console.error('Weather cache write error:', error);
    // Don't throw - caching is not critical
  }
}

async function getKVFallback(key: string, env: Env): Promise<WeatherResponse | null> {
  try {
    const kvData = await env.WEATHER_CACHE?.get(key, { type: 'json' }) as WeatherData;
    
    if (kvData && kvData.timestamp) {
      const age = Date.now() - kvData.timestamp;
      
      // Use KV data if less than 4 hours old
      if (age < 14400000) { // 4 hours
        return {
          data: kvData,
          fresh: false,
          age: age
        };
      }
    }
  } catch (error) {
    console.error('KV weather fallback error:', error);
  }
  
  return null;
}

function errorResponse(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

// Cron handler for pre-warming weather cache
export async function preWarmWeatherCache(env: Env): Promise<void> {
  // This would be called by a Cron trigger to pre-warm weather data
  // for common locations along the trip route
  
  const commonLocations = [
    { lat: 39.7392, lon: -104.9903 }, // Denver, CO
    { lat: 41.8781, lon: -87.6298 },  // Chicago, IL
    { lat: 40.7128, lon: -74.0060 },  // New York, NY
    { lat: 34.0522, lon: -118.2437 }, // Los Angeles, CA
    { lat: 47.6062, lon: -122.3321 }  // Seattle, WA
  ];

  console.log('Pre-warming weather cache for common locations');
  
  for (const location of commonLocations) {
    try {
      await getWeatherData(location.lat, location.lon, env);
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`Failed to pre-warm weather for ${location.lat},${location.lon}:`, error);
    }
  }
}
