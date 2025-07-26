// Centralized API configuration for the Tesla Road Trip Tracker
// Handles all API endpoints and provides consistent error handling

export const API_CONFIG = {
  BASE_URL: 'https://awhittlewandering-api.kd8jc7v8cd.workers.dev',
  ENDPOINTS: {
    UNIFIED_DATA: '/api/v1/unified-data',
    TIMELINE: '/api/v1/timeline',
    LIVE_STATUS: '/api/v1/trip/live-status',
    TELEMETRY: '/api/v1/telemetry',
    HEALTH: '/health'
  },
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// Enhanced fetch wrapper with proper error handling and CORS
export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API request to ${endpoint} failed:`, error);
    throw error;
  }
}

// Specific API methods
export const api = {
  getUnifiedData: () => apiRequest(API_CONFIG.ENDPOINTS.UNIFIED_DATA),
  getTimeline: () => apiRequest(API_CONFIG.ENDPOINTS.TIMELINE),
  getLiveStatus: () => apiRequest(API_CONFIG.ENDPOINTS.LIVE_STATUS),
  getHealth: () => apiRequest(API_CONFIG.ENDPOINTS.HEALTH),
  submitTelemetry: (data: any) => apiRequest(API_CONFIG.ENDPOINTS.TELEMETRY, {
    method: 'POST',
    body: JSON.stringify(data)
  })
};
