import { Hono } from 'hono';
import { rateLimit } from 'hono-rate-limiter';

/**
 * Rate limiting middleware for Hono.
 * @param options - Configuration options.
 * @returns Hono middleware function.
 */
export const rateLimitMiddleware = (options: {
  windowMs?: number;
  limit?: number;
  keyGenerator?: (c: any) => string;
  handler?: (c: any) => any;
} = {}) => {
  const {
    windowMs = 60_000, // 1 minute
    limit = 10,
    keyGenerator = (c) => c.req.ip ?? 'anonymous',
    handler = (c) => c.json({ error: 'Too many requests', status: 429 }, 429),
  } = options;

  return rateLimit({
    windowMs,
    limit,
    keyGenerator,
    handler,
  });
};
