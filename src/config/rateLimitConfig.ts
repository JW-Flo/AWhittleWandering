export const RATE_LIMIT_CONFIG = {
  API_REQUESTS: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100 // Max 100 requests per window
  },
  LOGIN_REQUESTS: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10 // Max 10 login attempts per hour
  }
};
