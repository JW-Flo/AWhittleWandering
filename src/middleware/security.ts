import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';

// Security middleware configuration
export const securityMiddleware = {
  // CORS configuration with reasonable defaults
  cors: cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://awhittlewandering.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400 // 24 hours
  }),

  // Rate limiting to prevent brute force attacks
  rateLimiter: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false
  }),

  // Helmet for setting various HTTP headers for security
  helmet: helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://trusted-cdn.com'],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https://api.awhittlewandering.com']
      }
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }
  }),

  // Middleware to sanitize and validate request inputs
  sanitizeInput: (req: Request, res: Response, next: NextFunction) => {
    const sanitizeString = (input: string) => {
      return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
    };

    // Sanitize query parameters
    if (req.query) {
      Object.keys(req.query).forEach(key => {
        const value = req.query[key];
        if (typeof value === 'string') {
          req.query[key] = sanitizeString(value);
        }
      });
    }

    // Sanitize body parameters
    if (req.body) {
      Object.keys(req.body).forEach(key => {
        const value = req.body[key];
        if (typeof value === 'string') {
          req.body[key] = sanitizeString(value);
        }
      });
    }

    next();
  },

  // Error handling middleware
  errorHandler: (err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(`[Security Error] ${err.message}`);
    
    // Determine appropriate status code
    const statusCode = err.name === 'UnauthorizedError' ? 401 : 
                      err.name === 'ForbiddenError' ? 403 : 
                      500;

    res.status(statusCode).json({
      error: true,
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : err.message
    });
  }
};

// Middleware application helper
export const applySecurityMiddleware = (app: any) => {
  app.use(securityMiddleware.cors);
  app.use(securityMiddleware.rateLimiter);
  app.use(securityMiddleware.helmet);
  app.use(securityMiddleware.sanitizeInput);
  app.use(securityMiddleware.errorHandler);
};
