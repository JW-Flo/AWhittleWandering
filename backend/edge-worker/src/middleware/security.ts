import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';

export interface SecurityConfig {
  allowedOrigins?: string[];
  maxRequestsPerWindow?: number;
  requestWindowMs?: number;
}

export function createSecurityMiddleware(config: SecurityConfig = {}) {
  const {
    allowedOrigins = ['https://awhittlewandering.com'],
    maxRequestsPerWindow = 100,
    requestWindowMs = 15 * 60 * 1000 // 15 minutes
  } = config;

  // CORS Configuration
  const corsOptions = {
    origin: function (origin: string | undefined, callback: Function) {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  };

  // Rate Limiting Configuration
  const limiter = rateLimit({
    windowMs: requestWindowMs,
    max: maxRequestsPerWindow,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests, please try again later.'
  });

  return [
    helmet(), // Security HTTP headers
    cors(corsOptions), // CORS protection
    limiter // Rate limiting
  ];
}

export function errorHandler(
  err: Error, 
  req: Request, 
  res: Response, 
  next: NextFunction
) {
  console.error('Security Error: ${err.message}');
  
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ 
      error: 'Access denied',
      message: 'Origin not permitted'
    });
  }

  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred'
  });
}