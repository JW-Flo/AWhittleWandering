export const RATE_LIMIT_CONFIG = {
  API_POINTS: 100,    // Max requests per duration
  API_DURATION: 3600, // Duration in seconds (1 hour)
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379'
};
