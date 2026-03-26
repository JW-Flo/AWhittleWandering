import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

interface RateLimitConfig {
  windowMs?: number;
  max?: number;
  message?: string;
}

const createRateLimiter = (config: RateLimitConfig = {}) => {
  const limiter = rateLimit({
    windowMs: config.windowMs || 15 * 60 * 1000, // Default 15 minutes
    max: config.max || 100, // Default 100 requests per window
    message: config.message || 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  });

  return limiter;
};

// Predefined rate limit configurations
export const defaultRateLimiter = createRateLimiter();
export const strictRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'Rate limit exceeded for this endpoint'
});

export default createRateLimiter;