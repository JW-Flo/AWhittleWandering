import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

/**
 * Security middleware configuration for Express API
 */
class SecurityConfig {
  /**
   * Apply core security middleware to Express application
   * @param app Express application instance
   */
  static applyMiddleware(app: express.Application): void {
    // Helmet for setting secure HTTP headers
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:']
        }
      },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
    }));

    // CORS configuration with secure defaults
    app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
      maxAge: 86400
    }));

    // Rate limiting middleware
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests, please try again later',
      standardHeaders: true,
      legacyHeaders: false
    });
    app.use(limiter);

    // Additional security middleware
    app.use(this.xssProtection);
  }

  /**
   * XSS protection middleware
   * @param req Express request
   * @param res Express response
   * @param next Next middleware function
   */
  private static xssProtection(req: Request, res: Response, next: NextFunction): void {
    const sanitizeInput = (input: string): string => {
      return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
    };

    // Sanitize query parameters
    Object.keys(req.query).forEach(key => {
      const value = req.query[key];
      if (typeof value === 'string') {
        req.query[key] = sanitizeInput(value);
      }
    });

    // Sanitize body parameters
    if (req.body) {
      Object.keys(req.body).forEach(key => {
        const value = req.body[key];
        if (typeof value === 'string') {
          req.body[key] = sanitizeInput(value);
        }
      });
    }

    next();
  }
}

export default SecurityConfig;