// Centralized API configuration for A Whittle Wandering
// Handles all API endpoints and provides consistent error handling

const getApiBaseUrl = (): string => {
  // Highest precedence: explicit env override (Vite exposes import.meta.env)
  const viteEnv = (import.meta as any).env;
  if (viteEnv?.VITE_API_BASE_URL) return viteEnv.VITE_API_BASE_URL;

  // Dev mode: use empty string so requests go through Vite's /api proxy (vite.config.ts)
  if (viteEnv?.DEV) return '';

  // Production: workers.dev URL (includes account subdomain).
  // When custom domain DNS is configured, api.awhittlewandering.com routes to the same worker.
  return 'https://awhittlewandering-api.kd8jc7v8cd.workers.dev';
};

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  ENDPOINTS: {
    UNIFIED_DATA: '/api/v1/unified-data',
    LIVE_STATUS: '/api/v1/trip/status', // Use trip status for live status
    TELEMETRY: '/api/v1/telemetry',
    HEALTH: '/api/v1/health',
    CONFIG: '/api/v1/config', // Configuration endpoint for secure tokens
    ROUTE_OPTIMIZE: '/api/v1/route/optimize', // AI route optimization
    JOURNAL_GENERATE: '/api/v1/journal/generate' // AI journal generation
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

export const api = {
  baseUrl: getApiBaseUrl(),
  getUnifiedData: () => apiRequest(API_CONFIG.ENDPOINTS.UNIFIED_DATA),
  getLiveStatus: () => apiRequest(API_CONFIG.ENDPOINTS.LIVE_STATUS),
  getHealth: () => apiRequest(API_CONFIG.ENDPOINTS.HEALTH),
  getConfig: () => apiRequest(API_CONFIG.ENDPOINTS.CONFIG),
  optimizeRoute: (data: any) => apiRequest(API_CONFIG.ENDPOINTS.ROUTE_OPTIMIZE, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  generateJournal: (data: any) => apiRequest(API_CONFIG.ENDPOINTS.JOURNAL_GENERATE, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  submitTelemetry: (data: unknown) => apiRequest(API_CONFIG.ENDPOINTS.TELEMETRY, {
    method: 'POST',
    body: JSON.stringify(data)
  })
};
