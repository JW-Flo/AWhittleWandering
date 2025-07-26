// Production Security Configuration
export const SECURITY_CONFIG = {
  // Disable admin features in production
  ADMIN_FEATURES_ENABLED: true, // Keep enabled for our use case
  
  // API key validation
  MAX_API_KEY_LENGTH: 100,
  MIN_API_KEY_LENGTH: 10,
  
  // Rate limiting (client-side hints)
  API_CALL_COOLDOWN_MS: 1000,
  MAX_REQUESTS_PER_MINUTE: 10,
  
  // Data privacy
  LOCATION_PRECISION_DIGITS: 3, // Round to ~100m for Tesla tracking
  
  // Error handling
  SHOW_DETAILED_ERRORS: import.meta.env.DEV, // Show details in development only
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

// Enhanced error logging for production
export function logSecurityEvent(event: string, details?: any) {
  if (import.meta.env.PROD) {
    // In production, send to monitoring service
    console.log(`Security Event: ${event}`, details);
  } else {
    // In development, log with full details
    console.warn(`Security Event: ${event}`, details);
  }
}

// Rate limiting helper
export class RateLimiter {
  private calls: number[] = [];
  
  canMakeRequest(): boolean {
    const now = Date.now();
    const minuteAgo = now - 60000;
    
    // Remove old calls
    this.calls = this.calls.filter(time => time > minuteAgo);
    
    if (this.calls.length >= SECURITY_CONFIG.MAX_REQUESTS_PER_MINUTE) {
      logSecurityEvent('Rate limit exceeded', { 
        calls: this.calls.length,
        limit: SECURITY_CONFIG.MAX_REQUESTS_PER_MINUTE 
      });
      return false;
    }
    
    this.calls.push(now);
    return true;
  }
  
  getNextAllowedTime(): Date {
    if (this.calls.length === 0) return new Date();
    
    const oldestCall = Math.min(...this.calls);
    return new Date(oldestCall + 60000);
  }
}
