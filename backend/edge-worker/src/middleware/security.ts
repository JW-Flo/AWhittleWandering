import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';

// Security configuration types
interface SecurityConfig {
  allowedOrigins?: string[];
  maxRequestsPerWindow?: number;
  requestWindowMs?: number;
}

// Default security configuration
const defaultSecurityConfig: SecurityConfig = {
  allowedOrigins: ['https://awhittlewandering.com'],
  maxRequestsPerWindow: 100,
  requestWindowMs: 15 * 60 * 1000 // 15 minutes
};

/**
 * Create comprehensive security middleware
 * @param config Optional security configuration
 * @returns Express middleware stack
 */
export function createSecurityMiddleware(config: SecurityConfig = {}) {
  const securityConfig = { ...defaultSecurityConfig, ...config };

  // CORS configuration
  const corsOptions = {
    origin: securityConfig.allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
  };

  // Rate limiting configuration
  const limiter = rateLimit({
    windowMs: securityConfig.requestWindowMs,
    max: securityConfig.maxRequestsPerWindow,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests, please try again later.'
  });

  return [
    helmet(), // Secure HTTP headers
    cors(corsOptions), // Cross-origin resource sharing
    limiter, // Request rate limiting
    // Additional custom security middleware
    (req: Request, res: Response, next: NextFunction) => {
      // Optional: Add custom security checks
      // Example: Check for known malicious patterns
      const userAgent = req.get('User-Agent') || '';
      if (userAgent.includes('malicious')) {
        return res.status(403).json({ error: 'Access denied' });
      }
      next();
    }
  ];
}

/**
 * Validate and sanitize request input
 * @param req Express request object
 * @param res Express response object
 * @param next Next middleware function
 */
export function inputValidationMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Basic input sanitization
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    });

    // Optional: Add more specific validation logic
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid request input' });
  }
}
