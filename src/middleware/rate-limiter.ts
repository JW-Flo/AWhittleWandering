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
    const clientIp = req.ip || 'unknown';
    const currentTime = Date.now();

    // TODO: Implement more robust IP tracking
    const clientRecord = this.requestCounts.get(clientIp);

    if (clientRecord) {
      // Check if reset time has passed
      if (currentTime > clientRecord.resetTime) {
        this.requestCounts.set(clientIp, { count: 1, resetTime: currentTime + this.options.windowMs });
        return next();
      }

      // Check if max requests exceeded
      if (clientRecord.count >= this.options.maxRequests) {
        return res.status(429).json({ 
          error: 'Too Many Requests', 
          message: 'Rate limit exceeded' 
        });
      }

      // Increment request count
      this.requestCounts.set(clientIp, { 
        count: clientRecord.count + 1, 
        resetTime: clientRecord.resetTime 
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

  // Optional: Method to clear old entries
  clearExpiredEntries(): void {
    const currentTime = Date.now();
    for (const [ip, record] of this.requestCounts.entries()) {
      if (currentTime > record.resetTime) {
        this.requestCounts.delete(ip);
      }
    }
  }
}

export function createRateLimiter(options: RateLimiterOptions): RateLimiter {
  return new RateLimiter(options);
}

export default createRateLimiter;
