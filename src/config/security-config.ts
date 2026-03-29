import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { validationResult } from 'express-validator';

/**
 * Security middleware configuration
 */
class SecurityConfig {
  /**
   * Configure CORS settings
   */
  static getCorsOptions(): cors.CorsOptions {
    return {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
      maxAge: 86400
    };
  }

  /**
   * Create rate limiter middleware
   */
  static createRateLimiter(): express.RequestHandler {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests, please try again later',
      standardHeaders: true,
      legacyHeaders: false
    });
  }

  /**
   * Validation error handler middleware
   */
  static validationErrorHandler(req: Request, res: Response, next: NextFunction): void {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        errors: errors.array(),
        message: 'Validation failed'
      });
      return;
    }
    next();
  }

  /**
   * Apply security middlewares
   */
  static applyMiddlewares(app: express.Application): void {
    // Helmet for securing HTTP headers
    app.use(helmet());

    // CORS configuration
    app.use(cors(this.getCorsOptions()));

    // Rate limiting
    app.use(this.createRateLimiter());

    // JSON body parsing
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
  }
}

export default SecurityConfig;