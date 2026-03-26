import express from 'express';
import RateLimiter from './middleware/rateLimiter';
import { rateLimiterConfig } from './config/rateLimiterConfig';

const app = express();
const rateLimiter = new RateLimiter(rateLimiterConfig.redisUrl);

// Apply rate limiting middleware globally
app.use(rateLimiter.middleware({
  points: rateLimiterConfig.points,
  duration: rateLimiterConfig.duration
}));

// Other app configurations and routes...

export default app;
