/**
 * Mapbox Proxy Module
 * 
 * Secure proxy for Mapbox API endpoints that require secret tokens
 * - Geocoding, Directions, Isochrone APIs
 * - Rate limiting and circuit breaker
 * - Cache API for performance
 */

import { Env } from '../packages/shared/types';

export interface MapboxProxyResponse {
  success: boolean;
  data?: any;
  error?: string;
  cached?: boolean;
}

class MapboxProxy {
  private env: Env;
  private circuitBreakerOpenUntil: number = 0;
  private static readonly CIRCUIT_BREAKER_TIMEOUT = 30000; // 30 seconds
  private static readonly MAX_RETRIES = 3;

  constructor(env: Env) {
    this.env = env;
  }

  async handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    
    // Remove '/api/mapbox' prefix
    if (pathSegments[0] === 'api' && pathSegments[1] === 'mapbox') {
      pathSegments.splice(0, 2);
    }

    // Reconstruct the Mapbox API path
    const mapboxPath = '/' + pathSegments.join('/');
    const mapboxUrl = `https://api.mapbox.com${mapboxPath}${url.search}`;

    // Check circuit breaker
    if (Date.now() < this.circuitBreakerOpenUntil) {
      return this.errorResponse('Service temporarily unavailable', 503);
    }

    // Try cache first for GET requests
    if (request.method === 'GET') {
      const cachedResponse = await this.getCachedResponse(mapboxUrl);
      if (cachedResponse) {
        return cachedResponse;
      }
    }

    try {
      const response = await this.fetchFromMapbox(mapboxUrl, request);
      
      // Cache successful responses
      if (response.ok && request.method === 'GET') {
        await this.cacheResponse(mapboxUrl, response.clone());
      }

      // Reset circuit breaker on success
      this.circuitBreakerOpenUntil = 0;

      return response;
    } catch (error) {
      console.error('Mapbox API error:', error);
      
      // Record failure for rate limiting
      await this.recordFailure();
      
      // Open circuit breaker after multiple failures
      this.circuitBreakerOpenUntil = Date.now() + MapboxProxy.CIRCUIT_BREAKER_TIMEOUT;

      return this.errorResponse('Mapbox API unavailable', 502);
    }
  }

  private async fetchFromMapbox(url: string, originalRequest: Request): Promise<Response> {
    if (!this.env.MAPBOX_SECRET_TOKEN && !this.env.MAPBOX_TOKEN) {
      throw new Error('Mapbox token not configured');
    }

    // Use secret token if available, otherwise fall back to public token
    const token = this.env.MAPBOX_SECRET_TOKEN || this.env.MAPBOX_TOKEN;
    
    // Add access token to URL
    const mapboxUrl = new URL(url);
    mapboxUrl.searchParams.set('access_token', token);

    const headers = new Headers();
    headers.set('User-Agent', 'AWhittleWandering/1.0');
    
    // Copy relevant headers from original request
    if (originalRequest.headers.get('Content-Type')) {
      headers.set('Content-Type', originalRequest.headers.get('Content-Type')!);
    }

    const fetchOptions: RequestInit = {
      method: originalRequest.method,
      headers: headers
    };

    // Include body for non-GET requests
    if (originalRequest.method !== 'GET' && originalRequest.method !== 'HEAD') {
      fetchOptions.body = await originalRequest.arrayBuffer();
    }

    let lastError: Error | null = null;
    
    // Retry logic
    for (let attempt = 1; attempt <= MapboxProxy.MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(mapboxUrl.toString(), fetchOptions);
        
        if (response.status === 429) {
          // Rate limited - wait and retry
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000;
          
          if (attempt < MapboxProxy.MAX_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }

        return this.createProxyResponse(response);
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < MapboxProxy.MAX_RETRIES) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  private async getCachedResponse(url: string): Promise<Response | null> {
    try {
      const cacheKey = `mapbox:${this.hashUrl(url)}`;
      const cache = (caches as any).default;
      const cachedResponse = await cache.match(cacheKey);
      
      if (cachedResponse) {
        // Add cache hit header
        const headers = new Headers(cachedResponse.headers);
        headers.set('X-Mapbox-Cache', 'HIT');
        
        return new Response(cachedResponse.body, {
          status: cachedResponse.status,
          statusText: cachedResponse.statusText,
          headers: headers
        });
      }
    } catch (error) {
      console.error('Cache read error:', error);
    }
    
    return null;
  }

  private async cacheResponse(url: string, response: Response): Promise<void> {
    try {
      const cacheKey = `mapbox:${this.hashUrl(url)}`;
      const cache = (caches as any).default;
      
      // Determine cache TTL based on endpoint
      let cacheTtl = 300; // 5 minutes default
      
      if (url.includes('/geocoding/')) {
        cacheTtl = 3600; // 1 hour for geocoding
      } else if (url.includes('/directions/')) {
        cacheTtl = 900; // 15 minutes for directions
      } else if (url.includes('/styles/')) {
        cacheTtl = 86400; // 24 hours for styles
      }

      // Create cache response with appropriate headers
      const headers = new Headers(response.headers);
      headers.set('Cache-Control', `public, max-age=${cacheTtl}`);
      headers.set('X-Mapbox-Cache', 'MISS');
      
      const cacheResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers
      });

      await cache.put(cacheKey, cacheResponse);
    } catch (error) {
      console.error('Cache write error:', error);
      // Don't throw - caching is not critical
    }
  }

  private createProxyResponse(mapboxResponse: Response): Response {
    const headers = new Headers();
    
    // Copy relevant headers
    const allowedHeaders = [
      'content-type',
      'content-length',
      'cache-control',
      'etag',
      'last-modified'
    ];
    
    allowedHeaders.forEach(header => {
      const value = mapboxResponse.headers.get(header);
      if (value) {
        headers.set(header, value);
      }
    });

    // Add CORS headers
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return new Response(mapboxResponse.body, {
      status: mapboxResponse.status,
      statusText: mapboxResponse.statusText,
      headers: headers
    });
  }

  private async recordFailure(): Promise<void> {
    try {
      const now = Date.now();
      const key = `mapbox_failures:${Math.floor(now / 60000)}`; // Per minute bucket
      
      const current = await this.env.LIMIT_METRICS?.get(key) || '0';
      const count = parseInt(current) + 1;
      
      await this.env.LIMIT_METRICS?.put(key, count.toString(), { expirationTtl: 300 });
      
      // Log for monitoring
      console.log('mapbox_api_failure', { count, timestamp: now });
    } catch (error) {
      console.error('Failed to record failure metrics:', error);
    }
  }

  private errorResponse(message: string, status: number): Response {
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  private hashUrl(url: string): string {
    // Simple hash function for cache keys
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

export async function handleMapboxProxy(request: Request, env: Env): Promise<Response> {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  const proxy = new MapboxProxy(env);
  return await proxy.handleRequest(request);
}
