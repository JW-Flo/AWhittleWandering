import express from 'express';
import { createRateLimiter } from './middleware/rateLimiter';
import { RATE_LIMIT_CONFIG } from './config/rateLimitConfig';

const app = express();

// Global rate limiter
app.use(createRateLimiter(RATE_LIMIT_CONFIG.API_REQUESTS));

// Specific route rate limiters can be added like:
// app.use('/login', createRateLimiter(RATE_LIMIT_CONFIG.LOGIN_REQUESTS));

// Other middleware and route setup...

export default app;
