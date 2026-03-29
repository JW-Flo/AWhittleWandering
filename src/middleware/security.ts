import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';

/**
 * Enhanced security middleware configuration
 */
export const securityMiddleware = {
  /**
   * Basic helmet security headers
   */
  basicHeaders: helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:']
      }
    },
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin'
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }),

  /**
   * Rate limiting middleware to prevent brute force attacks
   */
  rateLimiter: (req: Request, res: Response, next: NextFunction) => {
    const MAX_REQUESTS = 100;
    const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

    // Implement rate limiting logic (placeholder)
    // In production, use libraries like express-rate-limit
    const requestCount = 0; // Track request count per IP

    if (requestCount > MAX_REQUESTS) {
      return res.status(429).json({
        error: 'Too many requests',
        message: 'Please slow down'
      });
    }

    next();
  },

  /**
   * CORS configuration with security defaults
   */
  corsOptions: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
  }
};