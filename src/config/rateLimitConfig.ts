export const DEFAULT_RATE_LIMITS = {
  API_REQUESTS: {
    points: 100,     // 100 requests
    duration: 60,   // per minute
    blockDuration: 300 // 5 minutes block if exceeded
  },
  LOGIN_ATTEMPTS: {
    points: 5,      // 5 login attempts
    duration: 300,  // per 5 minutes
    blockDuration: 1800 // 30 minutes block if exceeded
  },
  SIGNUP_ATTEMPTS: {
    points: 3,      // 3 signup attempts
    duration: 3600, // per hour
    blockDuration: 86400 // 24 hours block if exceeded
  }
};
