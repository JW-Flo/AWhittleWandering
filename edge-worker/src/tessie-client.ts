/**
 * Tessie API Client for Edge Worker
 * Handles all interactions with Tessie API for real-time vehicle data
 */

import { WorkerEnvironment } from './types/cloudflare';

export interface TessieVehicleData {
  vin: string;
  display_name: string;
  state: string;
  last_seen: number;
  charge_state: {
    battery_level: number;
    battery_range: number;
    charge_rate: number;
    charging_state: string;
    est_battery_range: number;
    time_to_full_charge: number;
  };
  drive_state: {
    latitude: number;
    longitude: number;
    heading: number;
    speed: number | null;
    power: number;
    shift_state: string | null;
  };
  climate_state: {
    inside_temp: number;
    outside_temp: number;
    driver_temp_setting: number;
    is_climate_on: boolean;
  };
  vehicle_state: {
    locked: boolean;
    sentry_mode: boolean;
    odometer: number;
    tire_pressure_front_left: number;
    tire_pressure_front_right: number;
    tire_pressure_rear_left: number;
    tire_pressure_rear_right: number;
  };
}

export interface TessieStreamData {
  data: {
    Soc?: number;
    Speed?: number;
    Latitude?: number;
    Longitude?: number;
    Heading?: number;
    Power?: number;
    Odometer?: number;
    InsideTemp?: number;
    OutsideTemp?: number;
    BatteryRange?: number;
    EstBatteryRange?: number;
    ChargeRate?: number;
  };
  createdAt: string;
}

export class TessieAPIClient {
  private baseUrl = 'https://api.tessie.com';
  private token: string;
  private vin: string;

  constructor(env: WorkerEnvironment) {
    this.token = env.TESSIE_API_TOKEN || '';
    this.vin = env.TESSIE_VIN || '';
    
    if (!this.token) {
      throw new Error('TESSIE_API_TOKEN is required');
    }
  }

  /**
   * Get current vehicle state from Tessie
   */
  async getVehicleState(): Promise<TessieVehicleData> {
    const url = `${this.baseUrl}/${this.vin}/state`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Tessie API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data;
  }

  /**
   * Wake up the vehicle if needed
   */
  async wakeVehicle(): Promise<boolean> {
    const url = `${this.baseUrl}/${this.vin}/wake`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Failed to wake vehicle:', response.status);
      return false;
    }

    const result = await response.json();
    return result.result === true;
  }

  /**
   * Get live status (lighter weight than full state)
   */
  async getLiveStatus(): Promise<any> {
    const url = `${this.baseUrl}/${this.vin}/status`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Tessie API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Transform Tessie data to our standard format
   */
  transformToStandardFormat(tessieData: TessieVehicleData): any {
    return {
      id: tessieData.vin,
      name: tessieData.display_name || 'Tesla',
      model: 'Model 3', // This should come from vehicle config
      batteryLevel: tessieData.charge_state?.battery_level || 0,
      range: tessieData.charge_state?.battery_range || 0,
      estimatedRange: tessieData.charge_state?.est_battery_range || 0,
      speed: tessieData.drive_state?.speed || 0,
      power: tessieData.drive_state?.power || 0,
      charging: tessieData.charge_state?.charging_state === 'Charging',
      chargingState: tessieData.charge_state?.charging_state || 'Disconnected',
      chargeRate: tessieData.charge_state?.charge_rate || 0,
      timeToFullCharge: tessieData.charge_state?.time_to_full_charge || 0,
      location: {
        latitude: tessieData.drive_state?.latitude || 0,
        longitude: tessieData.drive_state?.longitude || 0,
        heading: tessieData.drive_state?.heading || 0
      },
      temperature: {
        inside: tessieData.climate_state?.inside_temp || 0,
        outside: tessieData.climate_state?.outside_temp || 0
      },
      climate: {
        enabled: tessieData.climate_state?.is_climate_on || false,
        temperature: tessieData.climate_state?.driver_temp_setting || 0
      },
      locked: tessieData.vehicle_state?.locked || false,
      sentry_mode: tessieData.vehicle_state?.sentry_mode || false,
      odometer: tessieData.vehicle_state?.odometer || 0,
      tire_pressure: {
        front_left: tessieData.vehicle_state?.tire_pressure_front_left || 0,
        front_right: tessieData.vehicle_state?.tire_pressure_front_right || 0,
        rear_left: tessieData.vehicle_state?.tire_pressure_rear_left || 0,
        rear_right: tessieData.vehicle_state?.tire_pressure_rear_right || 0
      },
      state: tessieData.state || 'unknown',
      last_seen: tessieData.last_seen || Date.now(),
      last_updated: new Date().toISOString()
    };
  }

  /**
   * Transform streaming data to standard format
   */
  transformStreamData(streamData: TessieStreamData): any {
    const data = streamData.data;
    return {
      batteryLevel: data.Soc,
      speed: data.Speed,
      location: {
        latitude: data.Latitude,
        longitude: data.Longitude,
        heading: data.Heading
      },
      power: data.Power,
      odometer: data.Odometer,
      temperature: {
        inside: data.InsideTemp,
        outside: data.OutsideTemp
      },
      range: data.BatteryRange,
      estimatedRange: data.EstBatteryRange,
      chargeRate: data.ChargeRate,
      timestamp: streamData.createdAt,
      last_updated: new Date().toISOString()
    };
  }
}
