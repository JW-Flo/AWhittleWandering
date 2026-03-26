import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';

interface RateLimiterOptions {
  points: number;
  duration: number;
  blockDuration?: number;
}

class RateLimiter {
  private redis: Redis;

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl);
  }

  public middleware(options: RateLimiterOptions) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const clientIp = req.ip;
      const key = `rate_limit:${clientIp}`;

      try {
        const currentRequests = await this.redis.incr(key);
        await this.redis.expire(key, options.duration);

        if (currentRequests > options.points) {
          const blockKey = `block_limit:${clientIp}`;
          const isBlocked = await this.redis.get(blockKey);

          if (!isBlocked) {
            await this.redis.set(blockKey, '1', 'EX', options.blockDuration || 300);
            return res.status(429).json({
              error: 'Too Many Requests',
              message: 'You have exceeded the rate limit. Please try again later.'
            });
          }

          return res.status(429).json({
            error: 'Rate Limit Exceeded',
            message: 'Your IP is temporarily blocked due to excessive requests.'
          });
        }

        next();
      } catch (error) {
        console.error('Rate limiter error:', error);
        next(error);
      }
    };
  }
}

export default RateLimiter;
