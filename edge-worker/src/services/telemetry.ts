/**
 * Telemetry Service
 * Wraps the Tessie API client with a toggle for live telemetry
 * When LIVE_TELEMETRY_ENABLED is false, returns cached/simulated data instead
 */

import { TessieAPIClient, TessieVehicleData, TessieStreamData } from '../tessie-client';
import { WorkerEnvironment } from '../types/cloudflare';

// Interface for Telemetry Service options
interface TelemetryServiceOptions {
  cacheExpiryMs?: number;  // How long to cache data in milliseconds
}

// Default cache values
const DEFAULT_CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

// Telemetry cache type
interface TelemetryCache {
  vehicleState?: {
    data: Record<string, unknown>;
    timestamp: number;
  };
  liveStatus?: {
    data: Record<string, unknown>;
    timestamp: number;
  };
}

/**
 * Telemetry Service class
 * Manages vehicle telemetry data with a live toggle option
 */
export class TelemetryService {
  private tessieClient: TessieAPIClient;
  private liveTelemetryEnabled: boolean;
  private cacheExpiryMs: number;
  private cache: TelemetryCache = {};
  
  /**
   * Create a new telemetry service
   * @param env Worker environment including LIVE_TELEMETRY_ENABLED
   * @param options Service options
   */
  constructor(env: WorkerEnvironment, options: TelemetryServiceOptions = {}) {
    this.tessieClient = new TessieAPIClient(env);
    
    // Parse LIVE_TELEMETRY_ENABLED - default to false for safety
    this.liveTelemetryEnabled = this.parseBooleanEnv(env.LIVE_TELEMETRY_ENABLED, false);
    
    // Set cache expiry time
    this.cacheExpiryMs = options.cacheExpiryMs || DEFAULT_CACHE_EXPIRY_MS;
    
    console.log(`TelemetryService initialized with live telemetry ${this.liveTelemetryEnabled ? 'enabled' : 'disabled'}`);
  }
  
  /**
   * Parse a boolean environment variable
   * @param value The environment variable value
   * @param defaultValue Default value if not set
   * @returns Parsed boolean value
   */
  private parseBooleanEnv(value: string | undefined, defaultValue: boolean): boolean {
    if (value === undefined) return defaultValue;
    return value.toLowerCase() === 'true';
  }
  
  /**
   * Check if cached data is still valid
   * @param timestamp When the data was cached
   * @returns True if cache is valid
   */
  private isCacheValid(timestamp: number): boolean {
    const now = Date.now();
    return (now - timestamp) < this.cacheExpiryMs;
  }
  
  /**
   * Get vehicle state (either live or cached)
   * @returns Vehicle state data
   */
  async getVehicleState(): Promise<Record<string, unknown>> {
    // If live telemetry is enabled, fetch from the real API
    if (this.liveTelemetryEnabled) {
      try {
        const data = await this.tessieClient.getVehicleState();
        const transformedData = this.tessieClient.transformToStandardFormat(data);
        
        // Update cache
        this.cache.vehicleState = {
          data: transformedData,
          timestamp: Date.now()
        };
        
        return transformedData;
      } catch (error) {
        console.error('Error fetching live vehicle state:', error);
        
        // Fall back to cache if available
        if (this.cache.vehicleState) {
          console.log('Falling back to cached vehicle state');
          return this.cache.vehicleState.data;
        }
        
        throw error;
      }
    } 
    
    // Live telemetry disabled - use cache if available and valid
    if (this.cache.vehicleState && this.isCacheValid(this.cache.vehicleState.timestamp)) {
      return this.cache.vehicleState.data;
    }
    
    // Generate simulated data if no cache or expired cache
    const simulatedData = this.generateSimulatedVehicleData();
    const transformedData = this.tessieClient.transformToStandardFormat(simulatedData);
    
    // Update cache
    this.cache.vehicleState = {
      data: transformedData,
      timestamp: Date.now()
    };
    
    return transformedData;
  }
  
  /**
   * Get live status (either live or cached)
   */
  async getLiveStatus(): Promise<Record<string, unknown>> {
    // If live telemetry is enabled, fetch from the real API
    if (this.liveTelemetryEnabled) {
      try {
        const data = await this.tessieClient.getLiveStatus();
        
        // Update cache
        this.cache.liveStatus = {
          data,
          timestamp: Date.now()
        };
        
        return data;
      } catch (error) {
        console.error('Error fetching live status:', error);
        
        // Fall back to cache if available
        if (this.cache.liveStatus) {
          console.log('Falling back to cached live status');
          return this.cache.liveStatus.data;
        }
        
        throw error;
      }
    }
    
    // Live telemetry disabled - use cache if available and valid
    if (this.cache.liveStatus && this.isCacheValid(this.cache.liveStatus.timestamp)) {
      return this.cache.liveStatus.data;
    }
    
    // Generate simulated data if no cache or expired cache
    const simulatedData = this.generateSimulatedVehicleData();
    
    // Use vehicle state data but simplified for status
    const statusData = {
      state: simulatedData.state,
      name: simulatedData.display_name,
      battery_level: simulatedData.charge_state.battery_level,
      latitude: simulatedData.drive_state.latitude,
      longitude: simulatedData.drive_state.longitude,
      last_seen: simulatedData.last_seen
    };
    
    // Update cache
    this.cache.liveStatus = {
      data: statusData,
      timestamp: Date.now()
    };
    
    return statusData;
  }
  
  /**
   * Wake the vehicle (only if live telemetry is enabled)
   */
  async wakeVehicle(): Promise<boolean> {
    if (!this.liveTelemetryEnabled) {
      console.log('Live telemetry disabled, skipping wake request');
      return true; // Pretend it worked
    }
    
    return this.tessieClient.wakeVehicle();
  }
  
  /**
   * Transform stream data (pass-through to client)
   */
  transformStreamData(streamData: TessieStreamData): Record<string, unknown> {
    return this.tessieClient.transformStreamData(streamData);
  }
  
  /**
   * Generate simulated vehicle data for when live telemetry is disabled
   * @returns Simulated vehicle data
   */
  private generateSimulatedVehicleData(): TessieVehicleData {
    // Generate random values with reasonable ranges
    const batteryLevel = 60 + Math.floor(Math.random() * 30); // 60-90%
    const range = batteryLevel * 4; // Miles based on battery level
    
    // Use predefined path for demo mode
    const pathCoordinates = [
      { lat: 40.7128, lng: -74.0060 }, // New York
      { lat: 38.9072, lng: -77.0369 }, // DC
      { lat: 37.7749, lng: -122.4194 }, // San Francisco
      { lat: 36.1699, lng: -115.1398 }, // Las Vegas
      { lat: 34.0522, lng: -118.2437 }, // Los Angeles
      { lat: 32.7157, lng: -117.1611 }, // San Diego
    ];
    
    // Pick a point based on time to simulate movement
    const hourOfDay = new Date().getHours();
    const pointIndex = hourOfDay % pathCoordinates.length;
    const location = pathCoordinates[pointIndex];
    
    // Temperature varies by location and time
    const outsideTemp = 65 + Math.floor(Math.random() * 20); // 65-85°F
    
    return {
      vin: 'SIMULATED_VIN_12345',
      display_name: 'Tesla Model Y (Simulated)',
      state: 'online',
      last_seen: Date.now(),
      charge_state: {
        battery_level: batteryLevel,
        battery_range: range,
        charge_rate: 0, // Not charging
        charging_state: 'Disconnected',
        est_battery_range: range * 0.9,
        time_to_full_charge: 0
      },
      drive_state: {
        latitude: location.lat,
        longitude: location.lng,
        heading: Math.floor(Math.random() * 360), // Random heading
        speed: 45 + Math.floor(Math.random() * 25), // 45-70 mph
        power: Math.floor(Math.random() * 30), // 0-30 kW
        shift_state: 'D' // Drive
      },
      climate_state: {
        inside_temp: 72,
        outside_temp: outsideTemp,
        driver_temp_setting: 72,
        is_climate_on: true
      },
      vehicle_state: {
        locked: true,
        sentry_mode: true,
        odometer: 12500 + (Math.floor(Date.now() / 10000000) % 1000), // Slowly increasing
        tire_pressure_front_left: 42,
        tire_pressure_front_right: 42,
        tire_pressure_rear_left: 42,
        tire_pressure_rear_right: 42
      }
    };
  }
}
