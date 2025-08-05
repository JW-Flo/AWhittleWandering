// Production Security Configuration
export const SECURITY_CONFIG = {
  // Disable admin features in production
  ADMIN_FEATURES_ENABLED: false,
  
  // API key validation
  MAX_API_KEY_LENGTH: 100,
  MIN_API_KEY_LENGTH: 10,
  
  // Rate limiting (client-side hints)
  API_CALL_COOLDOWN_MS: 1000,
  MAX_REQUESTS_PER_MINUTE: 10,
  
  // Data privacy
  LOCATION_PRECISION_DIGITS: 2, // Round to ~1 mile
  
  // Error handling
  SHOW_DETAILED_ERRORS: false,
} as const;

// Utility to validate API keys format (basic client-side validation)
export function isValidApiKeyFormat(apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== 'string') return false;
  
  const trimmed = apiKey.trim();
  return (
    trimmed.length >= SECURITY_CONFIG.MIN_API_KEY_LENGTH &&
    trimmed.length <= SECURITY_CONFIG.MAX_API_KEY_LENGTH &&
    /^[A-Za-z0-9_-]+$/.test(trimmed)
  );
}

// Utility to round location data for privacy
export function roundLocationForPrivacy(lat: number, lng: number) {
  const precision = SECURITY_CONFIG.LOCATION_PRECISION_DIGITS;
  return {
    lat: Math.round(lat * Math.pow(10, precision)) / Math.pow(10, precision),
    lng: Math.round(lng * Math.pow(10, precision)) / Math.pow(10, precision),
  };
}

// Sanitize error messages for production
export function sanitizeErrorMessage(error: any): string {
  if (!SECURITY_CONFIG.SHOW_DETAILED_ERRORS) {
    return "An error occurred. Please try again.";
  }
  return error?.message || "Unknown error";
}