import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';

interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
  redisClient?: Redis;
}

class RateLimitError extends Error {
  statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
    this.statusCode = 429;
  }
}

const createRateLimiter = (options: RateLimitOptions) => {
  const {
    maxRequests = 100,
    windowMs = 15 * 60 * 1000, // 15 minutes default
    redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const key = 'rate_limit:${ip}';

    try {
      const currentRequests = await redisClient.incr(key);
      
      if (currentRequests === 1) {
        await redisClient.expire(key, Math.floor(windowMs / 1000));
      }

      if (currentRequests > maxRequests) {
        throw new RateLimitError('Too many requests, please try again later');
      }

      next();
    } catch (error) {
      if (error instanceof RateLimitError) {
        return res.status(error.statusCode).json({
          error: 'Rate limit exceeded',
          message: error.message
        });
      }
      next(error);
    }
  };
};

export { createRateLimiter, RateLimitError };
