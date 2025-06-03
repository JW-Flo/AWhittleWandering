/**
 * TeslaAPIClient: Minimal Tesla API client for Cloudflare Workers.
 * Only supports real, production endpoints. No mock/test logic.
 * 
 * Methods:
 *   - listVehicles(): Promise<Vehicle[]>
 *   - getVehicleData(vehicleId: string): Promise<VehicleData>
 *   - refreshTokens(): Promise<{ access_token, refresh_token }>
 */

export interface TeslaToken {
  access_token: string;
  refresh_token: string;
}

export interface Vehicle {
  id_s: string;
  display_name: string;
  vin: string;
}

// Define more specific return type for vehicle data
export interface VehicleData {
  id: string;
  vehicle_id: number;
  vin: string;
  display_name: string;
  state: string;
  drive_state: {
    latitude: number;
    longitude: number;
    heading: number;
    speed: number | null;
    power: number;
    timestamp: number;
  };
  charge_state: {
    battery_level: number;
    battery_range: number;
    charging_state: string;
    charge_rate: number;
    minutes_to_full_charge: number;
    timestamp: number;
  };
  climate_state: {
    inside_temp: number;
    outside_temp: number;
    driver_temp_setting: number;
    passenger_temp_setting: number;
    is_climate_on: boolean;
    timestamp: number;
  };
  vehicle_state: {
    locked: boolean;
    sentry_mode: boolean;
    software_update: {
      status: string;
      version: string;
    };
    odometer: number;
    timestamp: number;
  };
  [key: string]: unknown; // For any additional properties that might be returned
}

export class TeslaAPIClient {
  private clientId: string;
  private clientSecret: string;
  private accessToken: string;
  private refreshToken: string;

  constructor(opts: {
    clientId: string;
    clientSecret: string;
    accessToken: string;
    refreshToken: string;
  }) {
    this.clientId = opts.clientId;
    this.clientSecret = opts.clientSecret;
    this.accessToken = opts.accessToken;
    this.refreshToken = opts.refreshToken;
  }
  
  // Public getters/setters for token management
  getAccessToken(): string {
    return this.accessToken;
  }
  
  getRefreshToken(): string {
    return this.refreshToken;
  }
  
  updateTokens(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  async listVehicles(): Promise<Vehicle[]> {
    const res = await fetch('https://owner-api.teslamotors.com/api/1/vehicles', {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });
    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('Tesla access token expired');
      }
      throw new Error(`Tesla API error: ${res.status}`);
    }
    const data = await res.json();
    return data.response as Vehicle[];
  }

  async getVehicleData(vehicleId: string): Promise<VehicleData> {
    const res = await fetch(`https://owner-api.teslamotors.com/api/1/vehicles/${vehicleId}/vehicle_data`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });
    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('Tesla access token expired');
      }
      throw new Error(`Tesla API error: ${res.status}`);
    }
    const data = await res.json();
    return data.response;
  }

  async refreshTokens(): Promise<TeslaToken> {
    const res = await fetch('https://auth.tesla.com/oauth2/v3/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: this.refreshToken,
        scope: 'openid email offline_access',
      }),
    });
    if (!res.ok) {
      throw new Error(`Tesla token refresh failed: ${res.status}`);
    }
    const data = await res.json();
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    };
  }
}
