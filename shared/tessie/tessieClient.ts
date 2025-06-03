/**
 * Tessie API Client for 48 Continental USA Project
 * Provides access to Tesla vehicle data through Tessie's API services
 */

import axios, { AxiosInstance } from 'axios';
import { WebSocket } from 'ws';

// Types for Tessie API responses
export interface TessieVehicle {
  id: string;
  vin: string;
  display_name: string;
  state: string;
  vehicle_id: string;
}

export interface VehicleData {
  id: string;
  vehicle_id: string;
  user_id: string;
  vin: string;
  display_name: string;
  option_codes: string;
  color: string | null;
  tokens: string[];
  state: string;
  in_service: boolean;
  id_s: string;
  calendar_enabled: boolean;
  api_version: number;
  charge_state: {
    battery_level: number;
    battery_range: number;
    charging_state: string;
    charge_limit_soc: number;
    charge_port_door_open: boolean;
    est_battery_range: number;
    ideal_battery_range: number;
    time_to_full_charge: number;
  };
  climate_state: {
    inside_temp: number;
    outside_temp: number;
    driver_temp_setting: number;
    passenger_temp_setting: number;
    is_climate_on: boolean;
  };
  drive_state: {
    heading: number;
    latitude: number;
    longitude: number;
    power: number;
    speed: number | null;
    shift_state: string | null;
  };
  gui_settings: {
    gui_distance_units: string;
    gui_temperature_units: string;
    gui_charge_rate_units: string;
    gui_24_hour_time: boolean;
    gui_range_display: string;
  };
  vehicle_config: {
    car_type: string;
    car_special_type: string;
    has_ludicrous_mode: boolean;
    exterior_color: string;
    wheel_type: string;
    has_air_suspension: boolean;
  };
  vehicle_state: {
    odometer: number;
    locked: boolean;
    sentry_mode: boolean;
    software_update: {
      status: string | null;
      version: string | null;
      download_perc: number | null;
    };
  };
}

export type TelemetryMessage = {
  timestamp: number;
  speed: number | null;
  power: number;
  soc: number;
  odometer: number;
  range: number;
  est_range: number;
  heading: number;
  longitude: number;
  latitude: number;
  elevation: number | null;
  shift_state: string | null;
  charging_state: string | null;
};

export class TessieClient {
  private readonly api: AxiosInstance;
  private readonly token: string;
  private readonly baseUrl: string;
  private telemetryConnections: Map<string, WebSocket> = new Map();

  constructor() {
    this.token = process.env.TESSIE_API_TOKEN || '';
    this.baseUrl = process.env.TESSIE_BASE || 'https://api.tessie.com';

    if (!this.token) {
      throw new Error('TESSIE_API_TOKEN environment variable is not set');
    }

    this.api = axios.create({
      baseURL: `${this.baseUrl}/api/1`,
      headers: {
        Authorization: this.token,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * List all vehicles associated with the Tessie account
   */
  async listVehicles(): Promise<TessieVehicle[]> {
    try {
      const response = await this.api.get('/vehicles');
      return response.data.response;
    } catch (error) {
      console.error('Error listing vehicles:', error);
      throw error;
    }
  }

  /**
   * Get detailed data for a specific vehicle
   */
  async getVehicleData(id: string): Promise<VehicleData> {
    try {
      const response = await this.api.get(`/vehicles/${id}/vehicle_data`);
      return response.data.response;
    } catch (error) {
      console.error(`Error getting data for vehicle ${id}:`, error);
      throw error;
    }
  }

  /**
   * Send a command to a vehicle
   */
  async sendCommand(id: string, command: string, payload = {}): Promise<any> {
    try {
      const response = await this.api.post(`/vehicles/${id}/command/${command}`, payload);
      return response.data;
    } catch (error) {
      console.error(`Error sending command ${command} to vehicle ${id}:`, error);
      throw error;
    }
  }

  /**
   * Connect to the telemetry stream for a vehicle
   * Returns a function to disconnect the stream
   */
  subscribeTelemetry(
    id: string, 
    onMessage: (data: TelemetryMessage) => void, 
    onError?: (error: Error) => void
  ): () => void {
    // Close any existing connection for this vehicle
    if (this.telemetryConnections.has(id)) {
      this.telemetryConnections.get(id)?.close();
    }

    // Create WebSocket connection
    const wsUrl = `wss://api.tessie.com/telemetry/${id}?access_token=${this.token}`;
    const ws = new WebSocket(wsUrl);

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString()) as TelemetryMessage;
        onMessage(data);
      } catch (error) {
        console.error('Error parsing telemetry message:', error);
        if (onError && error instanceof Error) {
          onError(error);
        }
      }
    });

    ws.on('error', (error) => {
      console.error(`WebSocket error for vehicle ${id}:`, error);
      if (onError) {
        onError(error);
      }
    });

    // Store the connection
    this.telemetryConnections.set(id, ws);

    // Return a function to disconnect
    return () => {
      if (this.telemetryConnections.has(id)) {
        this.telemetryConnections.get(id)?.close();
        this.telemetryConnections.delete(id);
      }
    };
  }

  /**
   * Use the enhanced Tessie API (not just Fleet API passthrough)
   */
  async getTessieVehicleData(id: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/tessie/vehicles/${id}`, {
        headers: { Authorization: this.token }
      });
      return response.data;
    } catch (error) {
      console.error(`Error getting Tessie data for vehicle ${id}:`, error);
      throw error;
    }
  }

  /**
   * Refresh the OAuth token to ensure it doesn't expire
   */
  async refreshToken(): Promise<string> {
    try {
      const response = await axios.post(`${this.baseUrl}/oauth/refresh`, {}, {
        headers: { Authorization: this.token }
      });
      return response.data.access_token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  }
}

// Singleton instance for use throughout the application
export const tessieClient = new TessieClient();
