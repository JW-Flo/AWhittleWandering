import express from 'express';
import RateLimiter from './middleware/rateLimiter';
import { RATE_LIMIT_CONFIG } from './config/rateLimitConfig';

const app = express();
const rateLimiter = new RateLimiter(RATE_LIMIT_CONFIG.REDIS_URL);

// Apply rate limiting middleware globally
app.use(rateLimiter.middleware({
  points: RATE_LIMIT_CONFIG.API_POINTS,
  duration: RATE_LIMIT_CONFIG.API_DURATION
}));

// Other app configurations and routes...

export default app;
