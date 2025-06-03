/**
 * TeslaAPIClient: Minimal Tesla API client for Cloudflare Workers.
 * Only supports real, production endpoints. No mock/test logic.
 * 
 * Methods:
 *   - listVehicles(): Promise<Vehicle[]>
 *   - getVehicleData(vehicleId: string): Promise<any>
 *   - refreshToken(): Promise<{ access_token, refresh_token }>
 */

type TeslaToken = {
  access_token: string;
  refresh_token: string;
};

type Vehicle = {
  id_s: string;
  display_name: string;
  vin: string;
};

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

  async getVehicleData(vehicleId: string): Promise<any> {
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

  async refreshToken(): Promise<TeslaToken> {
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
