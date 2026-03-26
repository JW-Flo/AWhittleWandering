export const rateLimiterConfig = {
  points: 100,  // Max requests per duration
  duration: 3600, // 1 hour in seconds
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379'
};
