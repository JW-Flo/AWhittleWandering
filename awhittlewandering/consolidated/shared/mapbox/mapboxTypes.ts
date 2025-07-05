/**
 * MapBox Type Definitions for 48 Continental Project
 * 
 * This file contains TypeScript interfaces for all MapBox API responses
 * to provide type safety when working with the MapBox services.
 */

/**
 * Geocoding API Responses
 */
export interface GeocodingFeature {
  id: string;
  type: string;
  place_type: string[];
  relevance: number;
  properties: {
    [key: string]: string | number | boolean | null;
  };
  text: string;
  place_name: string;
  center: [number, number]; // [longitude, latitude]
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  bbox?: [number, number, number, number]; // [west, south, east, north]
  context?: Array<{
    id: string;
    text: string;
    wikidata?: string;
    short_code?: string;
  }>;
}

export interface GeocodingResponse {
  type: 'FeatureCollection';
  query: string[];
  features: GeocodingFeature[];
  attribution: string;
}

/**
 * Directions API Responses
 */
export interface DirectionsWaypoint {
  distance: number;
  name: string;
  location: [number, number]; // [longitude, latitude]
}

export interface DirectionsRoute {
  distance: number; // in meters
  duration: number; // in seconds
  geometry: {
    coordinates: [number, number][]; // [longitude, latitude]
    type: string;
  };
  legs: Array<{
    distance: number;
    duration: number;
    summary: string;
    steps: Array<{
      distance: number;
      duration: number;
      geometry: {
        coordinates: [number, number][];
        type: string;
      };
      maneuver: {
        location: [number, number];
        instruction: string;
        type: string;
        modifier?: string;
      };
      name: string;
      mode: string;
    }>;
  }>;
  weight: number;
  weight_name: string;
}

export interface DirectionsResponse {
  routes: DirectionsRoute[];
  waypoints: DirectionsWaypoint[];
  code: string;
  uuid: string;
}

/**
 * Weather API Responses
 */
export interface WeatherCurrentConditions {
  time: string;
  temperature: number;
  weather_code: number;
  wind_speed: number;
  wind_direction: number;
  precipitation: number;
  cloud_cover: number;
}

export interface WeatherHourlyForecast {
  time: string[];
  temperature: number[];
  precipitation: number[];
  wind_speed: number[];
}

export interface WeatherDailyForecast {
  time: string[];
  weather_code: number[];
  temperature_max: number[];
  temperature_min: number[];
  precipitation_sum: number[];
}

export interface WeatherResponse {
  current: WeatherCurrentConditions;
  hourly: WeatherHourlyForecast;
  daily: WeatherDailyForecast;
  location: {
    latitude: number;
    longitude: number;
  };
  elevation: number;
  timezone: string;
  units: {
    temperature: string;
    wind_speed: string;
    precipitation: string;
  };
}

/**
 * Cache System Types
 */
export interface CacheItem<T> {
  value: T;
  expires: number;
}

export interface RateLimiter {
  tokens: number;
  lastRefill: number;
  perMinute: number;
  maxBurst: number;
}

/**
 * Options Types for API Calls
 */
export interface GeocodingOptions {
  limit?: number;
  country?: string;
  types?: string;
  fuzzyMatch?: boolean;
  language?: string;
}

export interface ReverseGeocodingOptions {
  types?: string;
  language?: string;
}

export interface DirectionsOptions {
  profile?: string;
  alternatives?: boolean;
  steps?: boolean;
  geometries?: string;
  overview?: string;
  annotations?: string;
}

export interface WeatherOptions {
  hourly?: string;
  daily?: string;
  current?: string;
}

export interface StaticMapOptions {
  zoom?: number;
  width?: number;
  height?: number;
  bearing?: number;
  pitch?: number;
  overlay?: string;
  padding?: number;
  logo?: boolean;
  attribution?: boolean;
  highDPI?: boolean;
}
