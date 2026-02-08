/**
 * Backend API Service - Connects frontend to ContinentalUSA backend
 * Integrates tesla-map-live frontend with robust backend infrastructure
 */

import { API_CONFIG } from '@/lib/api-config';

// --- Response types ---

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  service: string;
  resources: Record<string, string>;
  ingestion: {
    vehicleState: { lastUpdate: string; ageSeconds: number; total?: number };
    drives: { lastUpdate: string; ageSeconds: number; total: number };
    charges: { lastUpdate: string; ageSeconds: number; total: number };
    statesVisited: number;
  };
  warnings: string[];
  performance: { responseTimeMs: number; latency?: number };
}

export interface TripStatusResponse {
  tripId: string;
  tripName: string;
  status: string;
  timestamp: number;
}

export interface ComponentOverviewResponse {
  ok: boolean;
  journeyId: string;
  tripName: string;
  startDate: string;
  totalStates: number;
  statesVisited: number;
  totalMiles: number;
  totalDrives: number;
  totalCharges: number;
  currentOdometer: number;
  status: string;
  timestamp: string;
}

export interface CurrentStatusResponse {
  ok: boolean;
  battery: { level: number; range: number; charging: string };
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
    temperature: { inside: number | null; outside: number | null };
  };
}

export interface StatesProgressResponse {
  ok: boolean;
  states: Array<{
    state_name: string;
    state_code: string;
    first_visited_date: string;
    visit_count: number;
    total_miles_in_state: number;
    is_current_state: boolean;
  }>;
}

export interface RecentDrivesResponse {
  ok: boolean;
  drives: Array<{
    id: string;
    started_at: string;
    ended_at: string;
    start_address: string;
    end_address: string;
    distance_miles: number;
    duration_minutes: number;
    energy_used_kwh: number;
    start_state: string;
    end_state: string;
  }>;
}

export interface AnalyticsSummaryResponse {
  ok: boolean;
  journeyId: string;
  totalDistance: number;
  totalEnergy: number;
  averageEfficiency: number;
  totalCost: number;
  costPerMile: number;
  costSavings: number;
  carbonSaved: number;
  totalDrives: number;
  totalCharges: number;
  totalEnergyAdded: number;
}

export interface AnalyticsComprehensiveResponse {
  ok: boolean;
  daily: Array<{
    date: string;
    total_drives: number;
    total_distance_miles: number;
    total_energy_used_kwh: number;
    total_charges: number;
    total_energy_added_kwh: number;
    total_cost_usd: number;
    avg_speed_mph: number;
    max_speed_mph: number;
    efficiency_miles_per_kwh: number;
    supercharger_sessions: number;
    total_charge_time_minutes: number;
    states_visited_count: number;
    cities_visited_count: number;
  }>;
}

export interface AnalyticsEfficiencyResponse {
  ok: boolean;
  efficiency: Array<{
    date: string;
    miles_driven: number;
    energy_consumed_kwh: number;
    efficiency_miles_per_kwh: number;
    avg_outside_temp_f: number;
    avg_speed_mph: number;
  }>;
}

export interface AnalyticsChargingResponse {
  ok: boolean;
  byChargerType: Array<{
    charger_type: string;
    session_count: number;
    total_energy_added_kwh: number;
    avg_cost_per_kwh: number;
    avg_duration_minutes: number;
  }>;
}

export interface VehicleStateEnhancedResponse {
  ok: boolean;
  vehicleId: string;
  timestamp: string;
  state: Record<string, unknown> | null;
  freshness: { lastUpdate: string | null; ageSeconds: number | null };
  recent: {
    lastDrive: {
      id: string;
      started_at: string;
      ended_at: string;
      start_address: string;
      end_address: string;
      distance_miles: number;
    } | null;
    lastCharge: {
      id: string;
      started_at: string;
      ended_at: string;
      location: string;
      energy_added_kwh: number;
    } | null;
  };
}

export interface RouteOptimizeRequest {
  origin: string;
  destination: string;
  currentBattery?: number;
  vehicleModel?: string;
}

export interface RouteOptimizeResponse {
  ok: boolean;
  model: string;
  result: Record<string, unknown>;
  timestamp: string;
}

export interface JournalGenerateRequest {
  date: string;
  location: string;
  events: string[];
}

export interface JournalGenerateResponse {
  success: boolean;
  entry?: {
    content: string;
    location?: string;
    metadata?: {
      recentEfficiency?: number;
      totalMiles?: number;
      statesVisited?: string[];
    };
  };
}

export interface UnifiedDataResponse {
  overview?: {
    tripName?: string;
    daysElapsed?: number;
    statesVisited?: number;
    totalStates?: number;
  };
  currentStatus?: {
    location?: { state?: string; lastUpdate?: string };
    battery?: { level?: number };
  };
  [key: string]: unknown;
}

// --- Client interface ---

export interface BackendApiClient {
  health: () => Promise<HealthResponse>;
  getUnifiedData: () => Promise<UnifiedDataResponse>;
  getTripStatus: () => Promise<TripStatusResponse>;
  getComponentOverview: () => Promise<ComponentOverviewResponse>;
  getCurrentStatus: () => Promise<CurrentStatusResponse>;
  getStatesProgress: () => Promise<StatesProgressResponse>;
  getRecentDrives: () => Promise<RecentDrivesResponse>;
  getAnalyticsSummary: () => Promise<AnalyticsSummaryResponse>;
  getAnalyticsComprehensive: () => Promise<AnalyticsComprehensiveResponse>;
  getAnalyticsEfficiency: () => Promise<AnalyticsEfficiencyResponse>;
  getAnalyticsCharging: () => Promise<AnalyticsChargingResponse>;
  getVehicleStateEnhanced: () => Promise<VehicleStateEnhancedResponse>;
  optimizeRoute: (routeData: RouteOptimizeRequest) => Promise<RouteOptimizeResponse>;
  generateJournal: (journalData: JournalGenerateRequest) => Promise<JournalGenerateResponse>;
}

// --- Service implementation ---

class BackendApiService implements BackendApiClient {
  public readonly baseUrl: string;

  constructor(baseUrl: string = API_CONFIG.BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Backend API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Health & Status
  async health(): Promise<HealthResponse> {
    return this.request('/api/v1/health');
  }

  // Core Data Endpoints
  async getUnifiedData(): Promise<UnifiedDataResponse> {
    return this.request('/api/v1/unified-data');
  }

  async getTripStatus(): Promise<TripStatusResponse> {
    return this.request('/api/v1/trip-status');
  }

  // Component Data
  async getComponentOverview(): Promise<ComponentOverviewResponse> {
    return this.request('/api/v1/component/overview');
  }

  async getCurrentStatus(): Promise<CurrentStatusResponse> {
    return this.request('/api/v1/component/current-status');
  }

  async getStatesProgress(): Promise<StatesProgressResponse> {
    return this.request('/api/v1/component/states-progress');
  }

  async getRecentDrives(): Promise<RecentDrivesResponse> {
    return this.request('/api/v1/component/recent-drives');
  }

  // Analytics Endpoints
  async getAnalyticsSummary(): Promise<AnalyticsSummaryResponse> {
    return this.request('/api/v1/analytics/summary');
  }

  async getAnalyticsComprehensive(): Promise<AnalyticsComprehensiveResponse> {
    return this.request('/api/v1/analytics/comprehensive');
  }

  async getAnalyticsEfficiency(): Promise<AnalyticsEfficiencyResponse> {
    return this.request('/api/v1/analytics/efficiency');
  }

  async getAnalyticsCharging(): Promise<AnalyticsChargingResponse> {
    return this.request('/api/v1/analytics/charging');
  }

  // Vehicle State
  async getVehicleStateEnhanced(): Promise<VehicleStateEnhancedResponse> {
    return this.request('/api/v1/vehicle/state/enhanced');
  }

  // Route Optimization
  async optimizeRoute(routeData: RouteOptimizeRequest): Promise<RouteOptimizeResponse> {
    return this.request('/api/v1/route/optimize', {
      method: 'POST',
      body: JSON.stringify(routeData),
    });
  }

  // Journal Generation
  async generateJournal(journalData: JournalGenerateRequest): Promise<JournalGenerateResponse> {
    return this.request('/api/v1/journal/generate', {
      method: 'POST',
      body: JSON.stringify(journalData),
    });
  }
}

// Export singleton instance
export const backendApi = new BackendApiService();

// Export types
export type { BackendApiClient };
export default BackendApiService;
