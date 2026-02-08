/**
 * Backend API Service - Connects frontend to ContinentalUSA backend
 * Integrates tesla-map-live frontend with robust backend infrastructure
 */

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8787';

export interface BackendApiClient {
  health: () => Promise<any>;
  getUnifiedData: () => Promise<any>;
  getTripStatus: () => Promise<any>;
  getComponentOverview: () => Promise<any>;
  getCurrentStatus: () => Promise<any>;
  getStatesProgress: () => Promise<any>;
  getRecentDrives: () => Promise<any>;
  getAnalyticsSummary: () => Promise<any>;
  getAnalyticsComprehensive: () => Promise<any>;
  getAnalyticsEfficiency: () => Promise<any>;
  getAnalyticsCharging: () => Promise<any>;
  getVehicleStateEnhanced: () => Promise<any>;
  optimizeRoute: (routeData: any) => Promise<any>;
  generateJournal: (journalData: any) => Promise<any>;
}

class BackendApiService implements BackendApiClient {
  public readonly baseUrl: string;

  constructor(baseUrl: string = BACKEND_BASE_URL) {
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
  async health() {
    return this.request('/health');
  }

  // Core Data Endpoints
  async getUnifiedData() {
    return this.request('/api/v1/unified-data');
  }

  async getTripStatus() {
    return this.request('/trip-status');
  }

  // Component Data
  async getComponentOverview() {
    return this.request('/api/v1/component/overview');
  }

  async getCurrentStatus() {
    return this.request('/api/v1/component/current-status');
  }

  async getStatesProgress() {
    return this.request('/api/v1/component/states-progress');
  }

  async getRecentDrives() {
    return this.request('/api/v1/component/recent-drives');
  }

  // Analytics Endpoints
  async getAnalyticsSummary() {
    return this.request('/api/v1/analytics/summary');
  }

  async getAnalyticsComprehensive() {
    return this.request('/api/v1/analytics/comprehensive');
  }

  async getAnalyticsEfficiency() {
    return this.request('/api/v1/analytics/efficiency');
  }

  async getAnalyticsCharging() {
    return this.request('/api/v1/analytics/charging');
  }

  // Vehicle State
  async getVehicleStateEnhanced() {
    return this.request('/api/v1/vehicle/state/enhanced');
  }

  // Route Optimization
  async optimizeRoute(routeData: any) {
    return this.request('/api/v1/route/optimize', {
      method: 'POST',
      body: JSON.stringify(routeData),
    });
  }

  // Journal Generation
  async generateJournal(journalData: any) {
    return this.request('/api/v1/journal/generate', {
      method: 'POST',
      body: JSON.stringify(journalData),
    });
  }

  // Debug Endpoints (Development Only)
  async getTessieSample() {
    return this.request('/api/v1/debug/tessie-sample');
  }

  async getDrivesCheck() {
    return this.request('/api/v1/debug/drives-check');
  }
}

// Export singleton instance
export const backendApi = new BackendApiService();

// Export types
export type { BackendApiClient };
export default BackendApiService;
