/**
 * Telemetry Cache Durable Object
 * 
 * Manages live Tessie vehicle telemetry data with intelligent caching
 * - Rate limits upstream calls to respect Tesla API limits
 * - Caches data in KV for cross-PoP availability
 * - Provides graceful degradation with stale data fallbacks
 */

import { Env } from '../packages/shared/types';

export interface TelemetryData {
  latitude: number;
  longitude: number;
  timestamp: number;
  stateCode?: string;
  batteryLevel?: number;
  charging?: boolean;
  speed?: number;
  heading?: number;
  altitude?: number;
  temperature?: number;
}

export interface TelemetryResponse {
  data: TelemetryData | null;
  fresh: boolean;
  age: number; // milliseconds since last update
  error?: string;
}

export class TelemetryCacheDO {
  private state: any;
  private env: Env;
  private lastFetchTime: number = 0;
  private cachedData: TelemetryData | null = null;
  private circuitBreakerOpenUntil: number = 0;

  // Rate limiting: minimum 30 seconds between Tessie API calls
  private static readonly MIN_FETCH_INTERVAL = 30000;
  private static readonly CIRCUIT_BREAKER_TIMEOUT = 300000; // 5 minutes
  private static readonly KV_TTL = 86400; // 24 hours

  constructor(state: any, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    if (url.pathname === '/latest') {
      return this.handleGetLatest();
    }
    
    return new Response('Not Found', { status: 404 });
  }

  private async handleGetLatest(): Promise<Response> {
    try {
      const telemetryResponse = await this.getLatestTelemetry();
      
      return new Response(JSON.stringify(telemetryResponse), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'max-age=5, stale-while-revalidate=60'
        }
      });
    } catch (error) {
      console.error('Error getting latest telemetry:', error);
      
      return new Response(JSON.stringify({
        data: null,
        fresh: false,
        age: 0,
        error: 'telemetry_unavailable'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private async getLatestTelemetry(): Promise<TelemetryResponse> {
    const now = Date.now();
    
    // Check if we have fresh cached data
    if (this.cachedData && (now - this.lastFetchTime) < TelemetryCacheDO.MIN_FETCH_INTERVAL) {
      return {
        data: this.cachedData,
        fresh: true,
        age: now - this.lastFetchTime
      };
    }

    // Check circuit breaker
    if (now < this.circuitBreakerOpenUntil) {
      console.log('Circuit breaker open, using KV fallback');
      return await this.getKVFallback();
    }

    // Try to fetch fresh data from Tessie
    try {
      const freshData = await this.fetchFromTessie();
      
      if (freshData) {
        this.cachedData = freshData;
        this.lastFetchTime = now;
        
        // Store in KV for cross-PoP availability
        await this.storeInKV(freshData);
        
        // Reset circuit breaker on success
        this.circuitBreakerOpenUntil = 0;
        
        return {
          data: freshData,
          fresh: true,
          age: 0
        };
      }
    } catch (error) {
      console.error('Failed to fetch from Tessie:', error);
      console.log('live_fetch_failed', { error: error.message, timestamp: now });
      
      // Open circuit breaker
      this.circuitBreakerOpenUntil = now + TelemetryCacheDO.CIRCUIT_BREAKER_TIMEOUT;
    }

    // Fallback to KV or cached data
    return await this.getKVFallback();
  }

  private async fetchFromTessie(): Promise<TelemetryData | null> {
    if (!this.env.TESSIE_TOKEN) {
      throw new Error('TESSIE_TOKEN not configured');
    }

    // Get vehicle ID (assuming single vehicle for now)
    const vehiclesResponse = await fetch('https://api.tessie.com/vehicles', {
      headers: {
        'Authorization': `Bearer ${this.env.TESSIE_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!vehiclesResponse.ok) {
      throw new Error(`Tessie vehicles API error: ${vehiclesResponse.status}`);
    }

    const vehicles = await vehiclesResponse.json() as any[];
    
    if (!vehicles || vehicles.length === 0) {
      throw new Error('No vehicles found in Tessie account');
    }

    const vehicleId = vehicles[0].id;

    // Fetch vehicle data
    const dataResponse = await fetch(`https://api.tessie.com/vehicles/${vehicleId}/state`, {
      headers: {
        'Authorization': `Bearer ${this.env.TESSIE_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!dataResponse.ok) {
      throw new Error(`Tessie vehicle data API error: ${dataResponse.status}`);
    }

    const vehicleData = await dataResponse.json() as any;

    // Transform Tessie data to our format
    return {
      latitude: vehicleData.drive_state?.latitude || 0,
      longitude: vehicleData.drive_state?.longitude || 0,
      timestamp: Date.now(),
      stateCode: this.getStateCode(vehicleData.drive_state?.latitude, vehicleData.drive_state?.longitude),
      batteryLevel: vehicleData.charge_state?.battery_level,
      charging: vehicleData.charge_state?.charging_state === 'Charging',
      speed: vehicleData.drive_state?.speed,
      heading: vehicleData.drive_state?.heading,
      altitude: vehicleData.drive_state?.gps_as_of,
      temperature: vehicleData.climate_state?.outside_temp
    };
  }

  private async getKVFallback(): Promise<TelemetryResponse> {
    try {
      // Try to get from KV first
      const kvData = await this.env.TELEMETRY_CACHE?.get('latest_telemetry', { type: 'json' });
      
      if (kvData && kvData.timestamp) {
        const age = Date.now() - kvData.timestamp;
        
        return {
          data: kvData,
          fresh: false,
          age: age
        };
      }
    } catch (error) {
      console.error('KV fallback failed:', error);
    }

    // If KV fails and we have in-memory cache, use it
    if (this.cachedData) {
      return {
        data: this.cachedData,
        fresh: false,
        age: Date.now() - this.lastFetchTime
      };
    }

    // No data available
    return {
      data: null,
      fresh: false,
      age: 0,
      error: 'no_data_available'
    };
  }

  private async storeInKV(data: TelemetryData): Promise<void> {
    try {
      await this.env.TELEMETRY_CACHE?.put(
        'latest_telemetry',
        JSON.stringify(data),
        { expirationTtl: TelemetryCacheDO.KV_TTL }
      );
    } catch (error) {
      console.error('Failed to store in KV:', error);
      // Don't throw - this is not critical
    }
  }

  private getStateCode(lat?: number, lng?: number): string | undefined {
    if (!lat || !lng) return undefined;
    
    // Simple state detection based on coordinates
    // This is a simplified version - in production you'd use a proper geocoding service
    if (lat >= 25.8 && lat <= 49.4 && lng >= -125 && lng <= -66.9) {
      // Continental US bounds - return state based on rough coordinate ranges
      // This is very approximate and should be replaced with proper geocoding
      if (lat >= 47 && lng <= -120) return 'WA';
      if (lat >= 42 && lat < 47 && lng <= -116) return 'OR';
      if (lat >= 32 && lat < 42 && lng <= -114) return 'CA';
      // Add more states as needed
      return 'US'; // Generic US if we can't determine specific state
    }
    
    return undefined;
  }
}

export default TelemetryCacheDO;
