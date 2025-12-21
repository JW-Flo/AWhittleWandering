// Shared types for API providers and vehicle data

export interface ApiProvider {
  id: string;
  name: string;
  display_name: string;
  description: string;
  setup_url: string;
  auth_type: string;
  supported_makes: string[];
  is_active: boolean;
}

export interface VehicleMake {
  id: string;
  name: string;
  logo_url: string | null;
  is_active: boolean;
}

export interface UserApiCredential {
  id: string;
  user_id: string;
  provider_id: string;
  encrypted_token: string;
  is_valid: boolean;
  last_verified_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface VehicleStatus {
  vin?: string;
  battery_level?: number;
  range?: number;
  odometer?: number;
  latitude?: number;
  longitude?: number;
  speed?: number;
  charging_state?: string;
  inside_temp?: number;
  outside_temp?: number;
  last_seen?: string;
}
