import { Request, Response, NextFunction } from 'express';

interface RateLimiterOptions {
  maxRequests: number;
  windowMs: number;
}

class RateLimiter {
  private requestCounts: Map<string, { count: number; resetTime: number }> = new Map();
  private options: RateLimiterOptions;

  constructor(options: RateLimiterOptions) {
    this.options = options;
  }

  middleware = (req: Request, res: Response, next: NextFunction): void => {
    const clientIp = this.getClientIp(req);

    // TODO: Implement more robust IP detection for proxy/load balancer scenarios
    const requestRecord = this.requestCounts.get(clientIp);
    const currentTime = Date.now();

    if (requestRecord) {
      // Check if reset time has passed
      if (currentTime > requestRecord.resetTime) {
        this.requestCounts.set(clientIp, { count: 1, resetTime: currentTime + this.options.windowMs });
        return next();
      }

      // Check if max requests exceeded
      if (requestRecord.count >= this.options.maxRequests) {
        return res.status(429).json({ 
          error: 'Too Many Requests', 
          message: 'Rate limit exceeded' 
        });
      }

      // Increment request count
      this.requestCounts.set(clientIp, { 
        count: requestRecord.count + 1, 
        resetTime: requestRecord.resetTime 
      });
    } else {
      // First request for this IP
      this.requestCounts.set(clientIp, { 
        count: 1, 
        resetTime: currentTime + this.options.windowMs 
      });
    }

    next();
  }

  private getClientIp(req: Request): string {
    // TODO: Improve IP extraction for different network configurations
    return req.ip || req.connection.remoteAddress || '127.0.0.1';
  }
}

export default RateLimiter;
