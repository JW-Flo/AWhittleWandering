import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Rate limiting configuration
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false
};

// Security middleware configuration
export const securityMiddleware = {
  // Helmet for setting various HTTP headers
  helmet: helmet(),

  // CORS middleware
  cors: cors(corsOptions),

  // Rate limiting middleware
  rateLimit: rateLimit(rateLimitConfig),

  // Custom XSS protection middleware
  xssProtection: (req: Request, res: Response, next: NextFunction) => {
    const sanitizeInput = (input: string) => {
      return input.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    };

    // Sanitize query parameters
    Object.keys(req.query).forEach(key => {
      req.query[key] = sanitizeInput(req.query[key] as string);
    });

    // Sanitize body parameters
    if (req.body) {
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string') {
          req.body[key] = sanitizeInput(req.body[key]);
        }
      });
    }

    next();
  },

  // Error handling middleware
  errorHandler: (err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err);
    res.status(500).json({
      status: 'error',
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : err.message
    });
  }
};
