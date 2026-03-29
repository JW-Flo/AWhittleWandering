import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';

interface RateLimiterOptions {
  points: number;
  duration: number;
}

class RateLimiter {
  private redis: Redis;

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl);
  }

  public middleware(options: RateLimiterOptions = { points: 100, duration: 3600 }) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const clientIp = req.ip;
      const key = `rate_limit:${clientIp}`;

      try {
        const currentRequests = await this.redis.incr(key);
        
        if (currentRequests === 1) {
          await this.redis.expire(key, options.duration);
        }

        if (currentRequests > options.points) {
          return res.status(429).json({
            error: 'Too Many Requests',
            message: 'Rate limit exceeded. Please try again later.'
          });
        }

        next();
      } catch (error) {
        console.error('Rate limiting error:', error);
        next();
      }
    };
  }
}

export default RateLimiter;
