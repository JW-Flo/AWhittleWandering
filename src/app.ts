import express from 'express';
import { globalRateLimiter, strictRateLimiter } from './middleware/rateLimiter';

const app = express();

// Global rate limiter for all routes
app.use(globalRateLimiter);

// Apply stricter rate limiting to sensitive routes
app.use('/auth', strictRateLimiter);
app.use('/admin', strictRateLimiter);

// Other middleware and route configurations...

export default app;
