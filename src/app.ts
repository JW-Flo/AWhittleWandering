import express from 'express';
import RateLimiter from './middleware/rateLimiter';
import { DEFAULT_RATE_LIMITS } from './config/rateLimitConfig';

const app = express();
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const rateLimiter = new RateLimiter(redisUrl);

// Global rate limiter middleware
app.use(rateLimiter.middleware(DEFAULT_RATE_LIMITS.API_REQUESTS));

// Route-specific rate limiters can be added as needed
app.post('/login', rateLimiter.middleware(DEFAULT_RATE_LIMITS.LOGIN_ATTEMPTS), (req, res) => {
  // Login route logic
});

app.post('/signup', rateLimiter.middleware(DEFAULT_RATE_LIMITS.SIGNUP_ATTEMPTS), (req, res) => {
  // Signup route logic
});

export default app;
