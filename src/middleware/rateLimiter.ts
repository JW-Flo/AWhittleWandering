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

export const globalRateLimiter = createRateLimiter();

export const strictRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // More restrictive
});

export default createRateLimiter;