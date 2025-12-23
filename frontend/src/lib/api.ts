// API configuration for A Whittle Wandering
const getApiBaseUrl = () => {
  const env = ((import.meta as any)?.env || {}) as Record<string, unknown>;
  const override = (env.VITE_API_BASE_URL || env.VITE_BACKEND_URL) as string | undefined;
  if (typeof override === 'string' && override.trim()) return override.trim();
  if (env.DEV === true) return 'http://localhost:8787';
  return 'https://awhittlewandering-api.kd8jc7v8cd.workers.dev';
};

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  ENDPOINTS: {
    HEALTH: '/api/v1/health',
    TELEMETRY: '/api/v1/telemetry',
    TRIP_STATUS: '/api/v1/trip-status',
  },
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

  async post(endpoint: string, data: unknown) {
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
