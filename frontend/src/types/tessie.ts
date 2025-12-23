/**
 * Tesla/Tessie data types
 * 
 * These types are used for data transformation between backend API responses
 * and frontend analysis services. The backend handles all Tessie API calls.
 */

export interface Vehicle {
  id: string;
  display_name: string;
  state: string;
  vin: string;
}

export interface VehicleData {
  battery_level: number;
  battery_range: number;
  charging_state: 'Charging' | 'Complete' | 'Disconnected' | string;
  inside_temp?: number;
  outside_temp?: number;
  odometer: number;
  speed?: number;
  latitude: number;
  longitude: number;
  heading?: number;
  timestamp: number;
}

export interface HistoricalDrive {
  id: string;
  start_time: string; // ISO string
  end_time: string;
  start_address: string;
  end_address: string;
  distance_miles: number;
  duration_hours: number;
  start_battery_level: number;
  end_battery_level: number;
  start_coordinates: { lat: number; lng: number };
  end_coordinates: { lat: number; lng: number };
}

export interface HistoricalCharge {
  id: string;
  start_time: string; // ISO string
  end_time: string;
  location: string;
  energy_added_kwh: number;
  cost: number;
  start_battery_level: number;
  end_battery_level: number;
  coordinates: { lat: number; lng: number };
}

// Backend unified data response types
export interface UnifiedDataResponse {
  overview: {
    tripName: string;
    vehicle: string;
    startDate: string;
    daysElapsed: number;
    totalMiles: number;
    currentOdometer: number;
    statesVisited: number;
    totalStates: number;
  };
  currentStatus: {
    battery: {
      level: number;
      range: number;
      charging: string;
    };
    location: {
      coordinates: { lat: number; lng: number };
      city: string;
      state: string;
      lastUpdate: string;
    };
    vehicle: {
      odometer: number;
      speed: number;
      heading: number;
      temperature: { inside?: number; outside?: number };
    };
  };
  timeline: {
    drives: Array<{
      id: number | string;
      date: string;
      startLocation: string;
      endLocation: string;
      distance: number;
      duration: number;
      energyUsed: number;
    }>;
    charges: Array<{
      id: number | string;
      date: string;
      location: string;
      energyAdded: number;
      duration: number;
    }>;
  };
  liveData: {
    timestamp: number;
    vehicleState: any;
    recentActivity: any;
  };
  tessieStatus: {
    connected: boolean;
    lastUpdate: string;
    dataFreshness: 'live' | 'cached' | 'unknown';
    error?: string;
  };
}

