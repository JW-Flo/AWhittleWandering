import { Request, Response, NextFunction } from 'express';

interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
}

class RateLimiter {
  private requestLog: Map<string, number[]> = new Map();

  constructor(private options: RateLimiterOptions) {}

  middleware = (req: Request, res: Response, next: NextFunction) => {
    const clientIp = req.ip;
    const currentTime = Date.now();

    const requestTimes = this.requestLog.get(clientIp) || [];
    const recentRequests = requestTimes.filter(
      time => currentTime - time < this.options.windowMs
    );

    if (recentRequests.length >= this.options.maxRequests) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.'
      });
    }

    recentRequests.push(currentTime);
    this.requestLog.set(clientIp, recentRequests);

    next();
  };
}

export const createRateLimiter = (options: RateLimiterOptions) => {
  return new RateLimiter(options).middleware;
};
