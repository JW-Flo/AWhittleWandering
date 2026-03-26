import { Request, Response, NextFunction } from 'express';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

class RateLimiter {
  private requestCounts: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(private config: RateLimitConfig) {}

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const clientIp = this.getClientIp(req);
      const currentTime = Date.now();

      const clientRecord = this.requestCounts.get(clientIp);

      if (clientRecord && clientRecord.resetTime > currentTime) {
        if (clientRecord.count >= this.config.maxRequests) {
          return res.status(429).json({
            status: 'error',
            message: 'Too many requests'
          });
        }

        clientRecord.count++;
      } else {
        this.requestCounts.set(clientIp, {
          count: 1,
          resetTime: currentTime + this.config.windowMs
        });
      }

      next();
    };
  }

  private getClientIp(req: Request): string {
    const xForwardedFor = req.headers['x-forwarded-for'];
    const remoteAddress = req.socket.remoteAddress;

    return (xForwardedFor as string || remoteAddress || 'unknown').toString();
  }
}

export default RateLimiter;
