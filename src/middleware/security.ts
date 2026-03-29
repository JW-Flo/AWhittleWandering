import { Request, Response, NextFunction } from 'express';

export interface SecurityConfig {
  allowedOrigins?: string[];
  maxRequestSize?: number;
  rateLimitWindowMs?: number;
  rateLimitMaxRequests?: number;
}

export class SecurityMiddleware {
  private config: SecurityConfig;

  constructor(config: SecurityConfig = {}) {
    this.config = {
      allowedOrigins: config.allowedOrigins || ['*'],
      maxRequestSize: config.maxRequestSize || 1024 * 1024, // 1MB default
      rateLimitWindowMs: config.rateLimitWindowMs || 15 * 60 * 1000, // 15 minutes
      rateLimitMaxRequests: config.rateLimitMaxRequests || 100
    };
  }

  public corsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    // TODO: Implement advanced CORS configuration
    const origin = req.get('origin') || '';
    const isAllowedOrigin = this.config.allowedOrigins?.includes('*') || 
      this.config.allowedOrigins?.includes(origin);

    if (!isAllowedOrigin) {
      res.status(403).json({ error: 'Origin not allowed' });
      return;
    }

    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    next();
  }

  public requestSizeMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    // TODO: Implement request size validation
    const contentLength = parseInt(req.get('content-length') || '0', 10);
    
    if (contentLength > (this.config.maxRequestSize || 0)) {
      res.status(413).json({ error: 'Request payload too large' });
      return;
    }

    next();
  }

  public rateLimitMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    // TODO: Implement robust rate limiting with request tracking
    // Placeholder for rate limit logic
    next();
  }
}

export default new SecurityMiddleware();