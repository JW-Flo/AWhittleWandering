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

    // TODO: Implement more robust IP extraction for different network scenarios
    const requestRecord = this.requestCounts.get(clientIp);
    const currentTime = Date.now();

    if (requestRecord) {
      // Check if reset time has passed
      if (currentTime > requestRecord.resetTime) {
        this.requestCounts.delete(clientIp);
      }

      // Check request count
      if (requestRecord.count >= this.options.maxRequests) {
        res.status(429).json({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.'
        });
        return;
      }

      // Increment request count
      requestRecord.count++;
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
    // TODO: Improve IP detection for proxied/load-balanced environments
    return (
      req.ip || 
      req.connection.remoteAddress || 
      req.socket.remoteAddress || 
      '127.0.0.1'
    );
  }
}

export default RateLimiter;
