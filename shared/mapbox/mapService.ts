/**
 * MapBox Service for 48 Continental Project
 * 
 * Provides robust API wrappers for all MapBox services with:
 * - Automatic token management
 * - Rate limiting (token bucket algorithm)
 * - Response caching with TTL
 * - Exponential backoff retry
 * - Comprehensive error handling
 */

import mapboxConfig from './mapboxConfig';
import {
  CacheItem,
  RateLimiter,
  GeocodingResponse,
  GeocodingOptions,
  ReverseGeocodingOptions,
  DirectionsResponse,
  DirectionsOptions,
  WeatherResponse,
  WeatherOptions,
  StaticMapOptions
} from './mapboxTypes';

class MapService {
  private cache: Record<string, CacheItem<unknown>> = {};
  private rateLimiters: Record<string, RateLimiter> = {};

  constructor() {
    // Initialize rate limiters
    Object.entries(mapboxConfig.rateLimits).forEach(([key, config]) => {
      this.rateLimiters[key] = {
        tokens: config.maxBurst,
        lastRefill: Date.now(),
        perMinute: config.perMinute,
        maxBurst: config.maxBurst
      };
    });
  }

  /**
   * Token bucket rate limiter
   * @param endpoint The endpoint category to rate limit
   * @returns true if request is allowed, false if it should be throttled
   */
  private checkRateLimit(endpoint: keyof typeof mapboxConfig.rateLimits): boolean {
    const limiter = this.rateLimiters[endpoint];
    if (!limiter) return true; // No limiter defined for this endpoint

    const now = Date.now();
    const elapsedMs = now - limiter.lastRefill;
    
    // Refill tokens based on elapsed time
    if (elapsedMs > 0) {
      const refillAmount = (elapsedMs / 60000) * limiter.perMinute;
      limiter.tokens = Math.min(limiter.tokens + refillAmount, limiter.maxBurst);
      limiter.lastRefill = now;
    }

    // Check if we have enough tokens
    if (limiter.tokens >= 1) {
      limiter.tokens -= 1;
      return true;
    }
    
    return false;
  }

  /**
   * Cache management functions
   */
  private getCached<T>(key: string): T | null {
    const item = this.cache[key];
    
    if (!item) return null;
    
    // Check if expired
    if (item.expires < Date.now()) {
      delete this.cache[key];
      return null;
    }
    
    return item.value as T;
  }

  private setCache<T>(key: string, value: T, ttlMs: number): void {
    this.cache[key] = {
      value,
      expires: Date.now() + ttlMs
    };
  }

  /**
   * Helper to create fully qualified URL with token
   */
  private buildUrl(baseUrl: string, params: Record<string, unknown> = {}): string {
    const url = new URL(baseUrl);
    
    // Add access token
    url.searchParams.append('access_token', mapboxConfig.getMapboxToken());
    
    // Add other params
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
    
    return url.toString();
  }

  /**
   * Make API request with retry and backoff
   */
  private async fetchWithRetry(
    url: string, 
    options: RequestInit = {}, 
    retries = 3, 
    backoff = 500
  ): Promise<Response> {
    try {
      const response = await fetch(url, options);
      
      // Handle common errors
      if (response.status === 429) {
        // Rate limited, wait and retry
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, backoff));
          return this.fetchWithRetry(url, options, retries - 1, backoff * 2);
        }
      }
      
      if (!response.ok) {
        throw new Error(`MapBox API error: ${response.status} ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, backoff));
        return this.fetchWithRetry(url, options, retries - 1, backoff * 2);
      }
      throw error;
    }
  }

  /**
   * Geocoding Service - Forward geocoding
   * Converts place names, addresses to coordinates
   */
  async geocode(
    query: string, 
    options: GeocodingOptions = {}
  ): Promise<GeocodingResponse> {
    // Build cache key
    const cacheKey = `geocode:${query}:${JSON.stringify(options)}`;
    
    // Check cache first
    const cached = this.getCached<GeocodingResponse>(cacheKey);
    if (cached) return cached;
    
    // Check rate limit
    if (!this.checkRateLimit('geocoding')) {
      throw new Error('Rate limit exceeded for geocoding API');
    }
    
    // Prepare URL
    const encodedQuery = encodeURIComponent(query);
    const baseUrl = `${mapboxConfig.endpoints.geocoding}/${encodedQuery}.json`;
    
    // Prepare parameters
    const params = {
      ...mapboxConfig.endpoints.params.geocoding,
      ...options
    };
    
    const url = this.buildUrl(baseUrl, params);
    
    // Make request
    const response = await this.fetchWithRetry(url);
    const data = await response.json();
    
    // Cache the result
    this.setCache(cacheKey, data, mapboxConfig.cacheTTL.geocoding);
    
    return data;
  }

  /**
   * Reverse Geocoding - Get place info from coordinates
   */
  async reverseGeocode(
    longitude: number, 
    latitude: number, 
    options: ReverseGeocodingOptions = {}
  ): Promise<GeocodingResponse> {
    // Build cache key
    const cacheKey = `rgeocode:${longitude},${latitude}:${JSON.stringify(options)}`;
    
    // Check cache first
    const cached = this.getCached<GeocodingResponse>(cacheKey);
    if (cached) return cached;
    
    // Check rate limit
    if (!this.checkRateLimit('geocoding')) {
      throw new Error('Rate limit exceeded for geocoding API');
    }
    
    // Prepare URL
    const baseUrl = `${mapboxConfig.endpoints.geocoding}/${longitude},${latitude}.json`;
    
    // Prepare parameters
    const params = {
      ...mapboxConfig.endpoints.params.geocoding,
      ...options
    };
    
    const url = this.buildUrl(baseUrl, params);
    
    // Make request
    const response = await this.fetchWithRetry(url);
    const data = await response.json();
    
    // Cache the result
    this.setCache(cacheKey, data, mapboxConfig.cacheTTL.geocoding);
    
    return data;
  }

  /**
   * Directions Service - Get route between two or more points
   */
  async getDirections(
    waypoints: [number, number][],
    options: DirectionsOptions = {}
  ): Promise<DirectionsResponse> {
    if (waypoints.length < 2) {
      throw new Error('At least 2 waypoints are required for directions');
    }
    
    // Build cache key
    const waypointsStr = waypoints.map(wp => `${wp[0]},${wp[1]}`).join(';');
    const cacheKey = `directions:${waypointsStr}:${JSON.stringify(options)}`;
    
    // Check cache first
    const cached = this.getCached<DirectionsResponse>(cacheKey);
    if (cached) return cached;
    
    // Check rate limit
    if (!this.checkRateLimit('directions')) {
      throw new Error('Rate limit exceeded for directions API');
    }
    
    // Prepare URL
    const profile = options.profile || mapboxConfig.endpoints.params.directions.profile;
    const coordinatesStr = waypoints.map(wp => `${wp[0]},${wp[1]}`).join(';');
    const baseUrl = `${mapboxConfig.endpoints.directions}/${profile}/${coordinatesStr}`;
    
    // Prepare parameters
    const params = {
      ...mapboxConfig.endpoints.params.directions,
      ...options
    };
    
    const url = this.buildUrl(baseUrl, params);
    
    // Make request
    const response = await this.fetchWithRetry(url);
    const data = await response.json();
    
    // Cache the result
    this.setCache(cacheKey, data, mapboxConfig.cacheTTL.directions);
    
    return data;
  }

  /**
   * Weather Service - Get current and forecast weather data
   */
  async getWeather(
    longitude: number,
    latitude: number,
    options: WeatherOptions = {}
  ): Promise<WeatherResponse> {
    // Build cache key
    const cacheKey = `weather:${longitude},${latitude}:${JSON.stringify(options)}`;
    
    // Check cache first
    const cached = this.getCached<WeatherResponse>(cacheKey);
    if (cached) return cached;
    
    // Check rate limit
    if (!this.checkRateLimit('weather')) {
      throw new Error('Rate limit exceeded for weather API');
    }
    
    // Prepare URL
    const baseUrl = `${mapboxConfig.endpoints.weather}/forecast/${longitude},${latitude}`;
    
    // Prepare parameters
    const params = {
      ...mapboxConfig.endpoints.params.weather,
      ...options
    };
    
    const url = this.buildUrl(baseUrl, params);
    
    // Make request
    const response = await this.fetchWithRetry(url);
    const data = await response.json();
    
    // Cache the result
    this.setCache(cacheKey, data, mapboxConfig.cacheTTL.weather);
    
    return data;
  }

  /**
   * Static Maps API - Generate static map images
   */
  generateStaticMapUrl(
    style: string,
    longitude: number,
    latitude: number,
    options: StaticMapOptions = {}
  ): string {
    // Default values
    const zoom = options.zoom ?? 12;
    const width = options.width ?? 600;
    const height = options.height ?? 400;
    const highDPI = options.highDPI ?? true;
    
    // Style URL processing
    const styleId = style.replace('mapbox://styles/', '');
    
    // Build URL path components
    let path = `${styleId}/static`;
    
    // Add overlay if provided
    if (options.overlay) {
      path += `/${options.overlay}`;
    }
    
    // Add center coordinates, zoom, bearing, pitch
    path += `/${longitude},${latitude},${zoom}`;
    if (options.bearing) path += `,${options.bearing}`;
    if (options.pitch) path += `,${options.pitch}`;
    
    // Add dimensions
    path += `/${width}x${height}`;
    
    // Add @2x for high DPI if needed
    if (highDPI) {
      path += '@2x';
    }
    
    // Build final URL with parameters
    const params: Record<string, unknown> = {};
    if (options.padding !== undefined) params.padding = options.padding;
    if (options.logo === false) params.logo = false;
    if (options.attribution === false) params.attribution = false;
    
    return this.buildUrl(`${mapboxConfig.endpoints.static}/${path}`, params);
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.cache = {};
  }
}

// Create and export singleton instance
const mapService = new MapService();
export default mapService;
