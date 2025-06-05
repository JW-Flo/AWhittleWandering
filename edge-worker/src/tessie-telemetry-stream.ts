/**
 * Tessie Fleet Telemetry WebSocket Stream
 * 
 * This module provides real-time vehicle telemetry streaming using Tessie's
 * fleet telemetry integration. It leverages the telemetry configuration
 * already set up on the vehicle to receive real-time updates.
 */

import { TessieClient, VehicleData } from '../../shared/tessie/tessieClient';

interface TelemetryData {
  BatteryLevel?: number;
  RatedRange?: number;
  IdealBatteryRange?: number;
  EnergyRemaining?: number;
  PackCurrent?: number;
  PackVoltage?: number;
  DetailedChargeState?: string;
  ChargeLimitSoc?: number;
  ChargeRate?: number;
  ChargerPower?: number;
  TimeToFullCharge?: number;
  ChargePortDoorOpen?: boolean;
  ChargePortLatch?: string;
  InsideTemp?: number;
  OutsideTemp?: number;
  DriverTempSetting?: number;
  PassengerTempSetting?: number;
  IsClimateOn?: boolean;
  HvacFanStatus?: number;
  VehicleSpeed?: number;
  Power?: number;
  ShiftState?: string;
  Gear?: string;
  GpsHeading?: number;
  Latitude?: number;
  Longitude?: number;
  Locked?: boolean;
  SentryMode?: boolean;
  Odometer?: number;
  Version?: string;
  VehicleName?: string;
  TpmsPressureFl?: number;
  TpmsPressureFr?: number;
  TpmsPressureRl?: number;
  TpmsPressureRr?: number;
  MilesToArrival?: number;
  MinutesToArrival?: number;
  DestinationName?: string;
  ExpectedEnergyPercentAtTripArrival?: number;
}

interface TelemetryMessage {
  vin: string;
  timestamp: number;
  data: TelemetryData;
  messageType: 'telemetry' | 'alert' | 'error';
}

interface StreamOptions {
  onData: (data: TelemetryMessage) => void;
  onError: (error: Error) => void;
  onStatusChange: (status: 'connected' | 'disconnected' | 'reconnecting') => void;
  fields?: string[]; // Specific fields to subscribe to
}

export class TessieTelemetryStream {
  private client: TessieClient;
  private ws: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private options: StreamOptions;
  private isClosing = false;

  constructor(client: TessieClient, options: StreamOptions) {
    this.client = client;
    this.options = options;
  }

  /**
   * Connect to Tessie's telemetry WebSocket endpoint
   */
  async connect(): Promise<void> {
    try {
      // Get vehicle data to get VIN and auth token
      const vehicles = await this.client.listVehicles();
      const vehicle = vehicles[0]; // Assuming first vehicle for now
      
      if (!vehicle) {
        throw new Error('No vehicles found');
      }
      
      // Get vehicle data which includes telemetry configuration
      const vehicleData = await this.client.getVehicleData(vehicle.id);
      
      // Construct WebSocket URL for Tessie's telemetry endpoint
      const wsUrl = `wss://telemetry.tessie.com/stream/${vehicle.vin}`;
      
      // Get auth token from environment
      const token = process.env.TESSIE_API_TOKEN;
      if (!token) {
        throw new Error('TESSIE_API_TOKEN not found in environment');
      }
      
      this.ws = new WebSocket(wsUrl);
      this.ws.onopen = () => {
        // Send authentication message
        this.ws?.send(JSON.stringify({
          type: 'auth',
          token: token,
          fields: this.options.fields || ['all']
        }));
      };

      this.setupEventHandlers();
    } catch (error) {
      console.error('Failed to connect to telemetry stream:', error);
      this.options.onError(error as Error);
      this.scheduleReconnect();
    }
  }

  /**
   * Set up WebSocket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('Telemetry stream connected');
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      this.options.onStatusChange('connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as TelemetryMessage;
        
        // Process different message types
        switch (message.messageType) {
          case 'telemetry':
            this.processTelemetryData(message);
            break;
          case 'alert':
            this.processAlert(message);
            break;
          case 'error':
            this.processError(message);
            break;
          default:
            console.warn('Unknown message type:', message.messageType);
        }
      } catch (error) {
        console.error('Failed to parse telemetry message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.options.onError(new Error('WebSocket connection error'));
    };

    this.ws.onclose = (event) => {
      console.log('Telemetry stream closed:', event.code, event.reason);
      this.options.onStatusChange('disconnected');
      
      if (!this.isClosing && event.code !== 1000) {
        // Abnormal closure, attempt to reconnect
        this.scheduleReconnect();
      }
    };
  }

  /**
   * Process incoming telemetry data
   */
  private processTelemetryData(message: TelemetryMessage): void {
    // Transform the raw telemetry data into a more usable format
    const transformedData = this.transformTelemetryData(message.data);
    
    // Merge with timestamp and VIN
    const fullData = {
      ...message,
      data: transformedData
    };

    this.options.onData(fullData);
  }

  /**
   * Transform raw telemetry data into a structured format
   */
  private transformTelemetryData(rawData: TelemetryData): Record<string, unknown> {
    // Group related fields together for easier consumption
    return {
      battery: {
        level: rawData.BatteryLevel,
        range: rawData.RatedRange,
        idealRange: rawData.IdealBatteryRange,
        energy: rawData.EnergyRemaining,
        power: rawData.PackCurrent ? rawData.PackCurrent * rawData.PackVoltage : 0
      },
      charging: {
        state: rawData.DetailedChargeState,
        chargeLimitSoc: rawData.ChargeLimitSoc,
        chargeRate: rawData.ChargeRate,
        chargerPower: rawData.ChargerPower,
        timeToFullCharge: rawData.TimeToFullCharge,
        chargePortDoorOpen: rawData.ChargePortDoorOpen,
        chargePortLatch: rawData.ChargePortLatch
      },
      climate: {
        insideTemp: rawData.InsideTemp,
        outsideTemp: rawData.OutsideTemp,
        driverTempSetting: rawData.DriverTempSetting,
        passengerTempSetting: rawData.PassengerTempSetting,
        isClimateOn: rawData.IsClimateOn,
        fanStatus: rawData.HvacFanStatus
      },
      driving: {
        speed: rawData.VehicleSpeed,
        power: rawData.Power,
        shiftState: rawData.ShiftState,
        gear: rawData.Gear,
        heading: rawData.GpsHeading
      },
      location: {
        latitude: rawData.Latitude,
        longitude: rawData.Longitude,
        heading: rawData.GpsHeading,
        speed: rawData.VehicleSpeed
      },
      vehicle: {
        locked: rawData.Locked,
        sentryMode: rawData.SentryMode,
        odometer: rawData.Odometer,
        softwareVersion: rawData.Version,
        vehicleName: rawData.VehicleName
      }
    };
  }

  /**
   * Process alert messages
   */
  private processAlert(message: TelemetryMessage): void {
    console.warn('Telemetry alert:', message);
    this.options.onData(message);
  }

  /**
   * Process error messages
   */
  private processError(message: TelemetryMessage): void {
    console.error('Telemetry error:', message);
    this.options.onError(new Error(`Telemetry error: ${JSON.stringify(message.data)}`));
  }

  /**
   * Schedule a reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.isClosing || this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.options.onStatusChange('reconnecting');
    this.reconnectAttempts++;
    
    // Exponential backoff
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);
    
    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay) as unknown as number;
  }

  /**
   * Send a command through the telemetry stream
   */
  send(command: Record<string, unknown>): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(command));
    } else {
      throw new Error('WebSocket is not connected');
    }
  }

  /**
   * Close the telemetry stream
   */
  close(): void {
    this.isClosing = true;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      this.ws.close(1000, 'Normal closure');
      this.ws = null;
    }
  }

  /**
   * Get the current connection state
   */
  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }
}

/**
 * Create a telemetry stream for a vehicle
 */
export function createTelemetryStream(
  client: TessieClient,
  options: StreamOptions
): TessieTelemetryStream {
  const stream = new TessieTelemetryStream(client, options);
  stream.connect();
  return stream;
}
