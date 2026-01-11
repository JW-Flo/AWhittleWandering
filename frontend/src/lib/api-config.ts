// Centralized API configuration for A Whittle Wandering
// Handles all API endpoints and provides consistent error handling

const getApiBaseUrl = () => {
  // Vite exposes `import.meta.env` at build time. Do NOT touch `process` in the browser;
  // referencing it can throw and crash app bootstrap (blank screen).
  const env = ((import.meta as any)?.env || {}) as Record<string, unknown>;

  // Highest precedence: explicit env override
  const override = (env.VITE_API_BASE_URL || env.VITE_BACKEND_URL) as string | undefined;
  if (typeof override === 'string' && override.trim()) return override.trim();

  // Local dev
  if (env.DEV === true) return 'http://localhost:8787';

  // Production default (Cloudflare Worker). Keep this aligned with deployments.
  return 'https://awhittlewandering-api.kd8jc7v8cd.workers.dev';
};

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  ENDPOINTS: {
    UNIFIED_DATA: '/api/v1/unified-data',
    TIMELINE: '/api/v1/unified-data', // Use unified data for timeline
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
  getTimeline: () => apiRequest(API_CONFIG.ENDPOINTS.TIMELINE),
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
