/**
 * Enhanced Vehicle Tracking Module
 *
 * Provides robust vehicle telemetry tracking with fallback mechanisms, 
 * error handling, data validation, and reconnection logic.
 * 
 * Implements watchdog timers, data buffering, and comprehensive logging.
 */

import { VehicleData } from '../utils/tesla-client';
import { logError, logInfo, logWarning } from '../utils/monitoring';

// Constants
const WATCHDOG_TIMEOUT = 30000; // 30 seconds
const MAX_BUFFER_SIZE = 100;    // Max number of telemetry entries to buffer

// Valid latitude range: -90 to 90
const MIN_LATITUDE = -90;
const MAX_LATITUDE = 90;

// Valid longitude range: -180 to 180
const MIN_LONGITUDE = -180;
const MAX_LONGITUDE = 180;

// Vehicle data types
export interface VehicleTelemetry {
  vehicleId: string;
  timestamp: number;
  position: {
    lat: number;
    lng: number;
    heading?: number;
    speed?: number;
    accuracy?: number;
  };
  metrics: {
    batteryLevel: number;
    batteryRange?: number;
    speed?: number;
    power?: number;
    temperature?: number;
    odometer?: number;
    chargingState?: string;
    isCharging?: boolean;
    isPreconditioning?: boolean;
    estTimeToFullCharge?: number;
  };
  status: {
    online: boolean;
    locked?: boolean;
    sentryMode?: boolean;
    softwareUpdateStatus?: string;
    softwareVersion?: string;
  };
  lastValidTimestamp?: number;
  errors?: Array<string>;
}

interface TrackerOptions {
  vehicleId: string;
  maxBufferSize?: number;
  watchdogTimeout?: number;
  onData?: (telemetry: VehicleTelemetry) => void;
  onError?: (error: Error, context?: Record<string, unknown>) => void;
  onConnectionChange?: (status: 'connected' | 'disconnected' | 'reconnecting' | 'error') => void;
}

/**
 * Vehicle Tracker class for managing vehicle telemetry
 * Includes data validation, watchdog timers, and buffering
 */
export class VehicleTracker {
  private vehicleId: string;
  private telemetryBuffer: VehicleTelemetry[] = [];
  private maxBufferSize: number;
  private lastUpdateTime: number = 0;
  private watchdogTimeout: number;
  private watchdogTimer?: ReturnType<typeof setTimeout>;
  private connectionStatus: 'connected' | 'disconnected' | 'reconnecting' | 'error' = 'disconnected';
  private onData?: (telemetry: VehicleTelemetry) => void;
  private onError?: (error: Error, context?: Record<string, unknown>) => void;
  private onConnectionChange?: (status: 'connected' | 'disconnected' | 'reconnecting' | 'error') => void;
  private retryCount: number = 0;
  private maxRetries: number = 5;
  private retryBackoffMs: number = 1000;
  
  /**
   * Create a new VehicleTracker
   * @param options - Configuration options for the tracker
   */
  constructor(options: TrackerOptions) {
    this.vehicleId = options.vehicleId;
    this.maxBufferSize = options.maxBufferSize || MAX_BUFFER_SIZE;
    this.watchdogTimeout = options.watchdogTimeout || WATCHDOG_TIMEOUT;
    this.onData = options.onData;
    this.onError = options.onError;
    this.onConnectionChange = options.onConnectionChange;
    
    // Start the watchdog timer
    this.startWatchdog();
    
    logInfo({
      message: "Vehicle tracker initialized", 
      vehicleId: this.vehicleId
    });
  }
  
  /**
   * Start the watchdog timer to detect data stream interruptions
   */
  private startWatchdog(): void {
    // Clear any existing watchdog timer
    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
    }
    
    // Set up a new watchdog timer
    // Use the standard setTimeout with explicit type
    this.watchdogTimer = setTimeout(() => {
      const now = Date.now();
      if (now - this.lastUpdateTime > this.watchdogTimeout && this.connectionStatus === 'connected') {
        this.handleWatchdogTimeout();
      }
      this.startWatchdog(); // Restart the watchdog
    }, this.watchdogTimeout);
  }
  
  /**
   * Handle watchdog timeout - connection may be lost
   */
  private handleWatchdogTimeout(): void {
    logWarning({
      message: "Watchdog timeout - no vehicle data received",
      vehicleId: this.vehicleId,
      lastUpdateTime: new Date(this.lastUpdateTime).toISOString(),
      timeoutThreshold: this.watchdogTimeout,
    });
    
    this.setConnectionStatus('reconnecting');
    this.initiateReconnection();
  }
  
  /**
   * Initiate reconnection procedure with exponential backoff
   */
  private initiateReconnection(): void {
    if (this.retryCount >= this.maxRetries) {
      this.setConnectionStatus('error');
      const error = new Error(`Maximum reconnection attempts (${this.maxRetries}) reached`);
      this.handleError(error, { context: 'reconnection' });
      return;
    }
    
    const backoffTime = this.retryBackoffMs * Math.pow(2, this.retryCount);
    this.retryCount++;
    
    logInfo({
      message: `Attempting reconnection (${this.retryCount}/${this.maxRetries})`,
      vehicleId: this.vehicleId,
      backoffTime,
    });
    
    // Simulate a reconnection attempt
    // In a real implementation, this would initiate a new API call or WebSocket connection
    setTimeout(() => {
      // Reconnection successful - this would be conditional on actual network success
      this.setConnectionStatus('connected');
      this.retryCount = 0;
      this.lastUpdateTime = Date.now();
      
      logInfo({
        message: "Reconnection successful",
        vehicleId: this.vehicleId
      });
    }, backoffTime);
  }
  
  /**
   * Set the connection status and notify listeners
   * @param status - The new connection status
   */
  private setConnectionStatus(status: 'connected' | 'disconnected' | 'reconnecting' | 'error'): void {
    if (this.connectionStatus !== status) {
      this.connectionStatus = status;
      
      if (this.onConnectionChange) {
        this.onConnectionChange(status);
      }
      
      logInfo({
        message: `Connection status changed to ${status}`,
        vehicleId: this.vehicleId
      });
    }
  }
  
  /**
   * Process vehicle data from the Tesla API
   * @param data - Raw vehicle data from the API
   * @returns Processed telemetry data with validation
   */
  public processVehicleData(data: VehicleData): VehicleTelemetry {
    try {
      // Extract and validate position data
      const position = this.extractAndValidatePosition(data);
      
      // Extract battery and other metrics
      const metrics = this.extractVehicleMetrics(data);
      
      // Extract vehicle status information
      const status = this.extractVehicleStatus(data);
      
      const timestamp = Date.now();
      
      // Create telemetry packet
      const telemetry: VehicleTelemetry = {
        vehicleId: this.vehicleId,
        timestamp,
        position,
        metrics,
        status
      };
      
      // Validate the telemetry packet
      const validatedTelemetry = this.validateTelemetryPacket(telemetry);
      
      // Update last update time
      this.lastUpdateTime = timestamp;
      
      // Add to buffer and notify
      this.addToBuffer(validatedTelemetry);
      
      // Connection is good if we got here
      this.setConnectionStatus('connected');
      
      return validatedTelemetry;
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error(String(error)), { 
        context: 'processVehicleData', 
        data 
      });
      
      // Return last known good telemetry with error flag
      const lastTelemetry = this.getLastValidTelemetry();
      if (lastTelemetry) {
        return {
          ...lastTelemetry,
          errors: [error instanceof Error ? error.message : String(error)]
        };
      }
      
      // Or return a basic error telemetry
      return {
        vehicleId: this.vehicleId,
        timestamp: Date.now(),
        position: { lat: 0, lng: 0 },  // Invalid coordinates
        metrics: { batteryLevel: 0 },  // Empty metrics
        status: { online: false },     // Offline status
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }
  
  /**
   * Extract and validate position data from vehicle data
   * @param data - Raw vehicle data
   * @returns Validated position data
   */
  private extractAndValidatePosition(data: VehicleData): VehicleTelemetry['position'] {
    const driveState = data.drive_state;
    
    if (!driveState) {
      throw new Error('Missing drive_state in vehicle data');
    }
    
    const { latitude, longitude, heading, speed } = driveState;
    
    // Validate latitude
    if (latitude === undefined || latitude === null || 
        isNaN(latitude) || 
        latitude < MIN_LATITUDE || 
        latitude > MAX_LATITUDE) {
      throw new Error(`Invalid latitude value: ${latitude}`);
    }
    
    // Validate longitude
    if (longitude === undefined || longitude === null || 
        isNaN(longitude) || 
        longitude < MIN_LONGITUDE || 
        longitude > MAX_LONGITUDE) {
      throw new Error(`Invalid longitude value: ${longitude}`);
    }
    
    return {
      lat: latitude,
      lng: longitude,
      heading: heading !== null ? heading : undefined,
      speed: speed !== null ? speed : undefined
    };
  }
  
  /**
   * Extract vehicle metrics from API data
   * @param data - Raw vehicle data
   * @returns Vehicle metrics
   */
  private extractVehicleMetrics(data: VehicleData): VehicleTelemetry['metrics'] {
    // Use type assertion to avoid TypeScript errors with optional properties
    const chargeState = (data.charge_state as Record<string, unknown>) || {};
    const driveState = (data.drive_state as Record<string, unknown>) || {};
    const climateState = (data.climate_state as Record<string, unknown>) || {};
    const vehicleState = (data.vehicle_state as Record<string, unknown>) || {};
    
    return {
      batteryLevel: (chargeState.battery_level as number) || 0,
      batteryRange: chargeState.battery_range as number | undefined,
      speed: (driveState.speed as number) || 0,
      power: driveState.power as number | undefined,
      temperature: climateState.outside_temp as number | undefined,
      odometer: vehicleState.odometer as number | undefined,
      chargingState: chargeState.charging_state as string | undefined,
      isCharging: chargeState.charging_state === 'Charging',
      isPreconditioning: climateState.is_climate_on === true,
      estTimeToFullCharge: chargeState.minutes_to_full_charge as number | undefined
    };
  }
  
  /**
   * Extract vehicle status information
   * @param data - Raw vehicle data
   * @returns Vehicle status
   */
  private extractVehicleStatus(data: VehicleData): VehicleTelemetry['status'] {
    // Use type assertion to avoid TypeScript errors with optional properties
    const vehicleState = (data.vehicle_state as Record<string, unknown>) || {};
    const softwareUpdate = (vehicleState.software_update as Record<string, unknown>) || {};
    
    return {
      online: data.state === 'online',
      locked: vehicleState.locked as boolean | undefined,
      sentryMode: vehicleState.sentry_mode as boolean | undefined,
      softwareUpdateStatus: softwareUpdate.status as string | undefined,
      softwareVersion: softwareUpdate.version as string | undefined
    };
  }
  
  /**
   * Validate a telemetry packet
   * @param telemetry - Telemetry data to validate
   * @returns Validated telemetry or throws an error
   */
  private validateTelemetryPacket(telemetry: VehicleTelemetry): VehicleTelemetry {
    const errors: string[] = [];
    
    // Basic validation checks
    if (!telemetry.vehicleId) {
      errors.push('Missing vehicle ID');
    }
    
    if (!telemetry.timestamp || isNaN(telemetry.timestamp)) {
      errors.push('Invalid timestamp');
      telemetry.timestamp = Date.now();
    }
    
    // Position validation
    if (!telemetry.position) {
      errors.push('Missing position data');
      telemetry.position = { lat: 0, lng: 0 };  // Default invalid position
    } else {
      // Check latitude range
      if (telemetry.position.lat < MIN_LATITUDE || telemetry.position.lat > MAX_LATITUDE) {
        errors.push(`Latitude out of range: ${telemetry.position.lat}`);
        telemetry.position.lat = 0;  // Reset to invalid value
      }
      
      // Check longitude range
      if (telemetry.position.lng < MIN_LONGITUDE || telemetry.position.lng > MAX_LONGITUDE) {
        errors.push(`Longitude out of range: ${telemetry.position.lng}`);
        telemetry.position.lng = 0;  // Reset to invalid value
      }
      
      // Validate heading (0-360 degrees)
      if (telemetry.position.heading !== undefined) {
        if (isNaN(telemetry.position.heading) || 
            telemetry.position.heading < 0 || 
            telemetry.position.heading > 360) {
          errors.push(`Invalid heading: ${telemetry.position.heading}`);
          delete telemetry.position.heading;
        }
      }
      
      // Validate speed (should be non-negative)
      if (telemetry.position.speed !== undefined) {
        if (isNaN(telemetry.position.speed) || telemetry.position.speed < 0) {
          errors.push(`Invalid speed: ${telemetry.position.speed}`);
          delete telemetry.position.speed;
        }
      }
    }
    
    // Metrics validation
    if (!telemetry.metrics) {
      errors.push('Missing metrics data');
      telemetry.metrics = { batteryLevel: 0 };  // Default metrics
    } else {
      // Battery level should be 0-100
      if (isNaN(telemetry.metrics.batteryLevel) || 
          telemetry.metrics.batteryLevel < 0 || 
          telemetry.metrics.batteryLevel > 100) {
        errors.push(`Invalid battery level: ${telemetry.metrics.batteryLevel}`);
        telemetry.metrics.batteryLevel = 0;
      }
    }
    
    // Status validation
    if (!telemetry.status) {
      errors.push('Missing status data');
      telemetry.status = { online: false };  // Default status
    }
    
    // Add any validation errors to the telemetry
    if (errors.length > 0) {
      telemetry.errors = errors;
      logWarning({
        message: "Telemetry validation issues detected",
        vehicleId: telemetry.vehicleId,
        errors
      });
    } else {
      telemetry.lastValidTimestamp = telemetry.timestamp;
    }
    
    return telemetry;
  }
  
  /**
   * Add telemetry to the buffer and notify listeners
   * @param telemetry - Telemetry data to add
   */
  private addToBuffer(telemetry: VehicleTelemetry): void {
    // Add to the front of the buffer
    this.telemetryBuffer.unshift(telemetry);
    
    // Trim the buffer if it exceeds the maximum size
    if (this.telemetryBuffer.length > this.maxBufferSize) {
      this.telemetryBuffer = this.telemetryBuffer.slice(0, this.maxBufferSize);
    }
    
    // Notify listeners of new data
    if (this.onData) {
      try {
        this.onData(telemetry);
      } catch (error) {
        this.handleError(error instanceof Error ? error : new Error(String(error)), { 
          context: 'onData callback' 
        });
      }
    }
  }
  
  /**
   * Get the last valid telemetry packet
   * @returns The last valid telemetry packet or null if none exists
   */
  public getLastValidTelemetry(): VehicleTelemetry | null {
    return this.telemetryBuffer.find(t => !t.errors || t.errors.length === 0) || null;
  }
  
  /**
   * Get recent telemetry data
   * @param count - Number of records to retrieve (default: 1)
   * @returns Array of telemetry records
   */
  public getRecentTelemetry(count: number = 1): VehicleTelemetry[] {
    return this.telemetryBuffer.slice(0, count);
  }
  
  /**
   * Get all buffered telemetry data
   * @returns Array of all buffered telemetry records
   */
  public getAllTelemetry(): VehicleTelemetry[] {
    return [...this.telemetryBuffer];
  }
  
  /**
   * Get filtered telemetry by time period
   * @param startTime - Start timestamp in ms
   * @param endTime - End timestamp in ms
   * @returns Filtered telemetry records
   */
  public getTelemetryByTimeRange(startTime: number, endTime: number): VehicleTelemetry[] {
    return this.telemetryBuffer.filter(
      t => t.timestamp >= startTime && t.timestamp <= endTime
    );
  }
  
  /**
   * Handle errors in the vehicle tracker
   * @param error - The error object
   * @param context - Additional context for the error
   */
  private handleError(error: Error, context?: Record<string, unknown>): void {
    logError({
      message: error.message,
      operation: "VehicleTracker",
      error: error.message,
      stack: error.stack,
      vehicleId: this.vehicleId,
      context
    });
    
    if (this.onError) {
      try {
        this.onError(error, context);
      } catch (callbackError) {
        console.error("Error in onError callback:", callbackError);
      }
    }
  }
  
  /**
   * Clean up the vehicle tracker
   */
  public destroy(): void {
    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
      this.watchdogTimer = undefined;
    }
    
    this.setConnectionStatus('disconnected');
    
    logInfo({
      message: "Vehicle tracker destroyed",
      vehicleId: this.vehicleId
    });
  }
}
