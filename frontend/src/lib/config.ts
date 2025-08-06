// Environment configuration for secure API key storage
// SECURITY: All API keys have been moved to backend for security
export const API_KEYS = {
  // TESSIE_API_KEY and MAPBOX_TOKEN are now served securely from backend
  // Use the dynamic-config.ts service to fetch tokens safely
} as const;

// Legacy storage functions - deprecated in favor of backend configuration
export const secureKeyStorage = {
  storeKeys: (_tessieKey?: string, _mapboxToken?: string) => {
    // These are now handled by the backend - this is for legacy compatibility only
    console.warn('secureKeyStorage.storeKeys is deprecated - tokens are now managed by backend');
  },
  
  getStoredKeys: () => {
    // Tokens are now provided by backend /api/v1/config endpoint
    console.warn('secureKeyStorage.getStoredKeys is deprecated - use dynamic-config.ts service instead');
    return {
      tessieKey: undefined, // Now handled by backend
      mapboxToken: undefined // Now handled by backend via dynamic-config.ts
    };
  },
  
  clearKeys: () => {
    // Clear any legacy stored keys
    localStorage.removeItem('tessie_api_key');
    localStorage.removeItem('mapbox_token');
  }
};
