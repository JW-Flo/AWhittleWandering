// API configuration for A Whittle Wandering
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787',
  ENDPOINTS: {
    HEALTH: '/health',
    TELEMETRY: '/api/v1/telemetry',
    TRIP_STATUS: '/api/v1/trip/status',
  }
} as const;

// Make API calls to our deployed backend
export const apiClient = {
  async get(endpoint: string) {
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }
    return response.json();
  },

  async post(endpoint: string, data: any) {
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }
    return response.json();
  }
};
