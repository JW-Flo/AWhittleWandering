import { z } from 'zod';

// Rate limit configuration schema
const RateLimitConfigSchema = z.object({
  maxRequests: z.number().int().positive().default(100),
  windowMs: z.number().int().positive().default(60000), // 1 minute default
  blockDurationMs: z.number().int().positive().default(300000), // 5 minutes
});

// Rate limit configuration type
export type RateLimitConfig = z.infer<typeof RateLimitConfigSchema>;

// Default rate limiting configuration
export const defaultRateLimitConfig: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 60000,
  blockDurationMs: 300000,
};

// Rate limiting middleware for Cloudflare Workers
export function createRateLimiter(config: RateLimitConfig = defaultRateLimitConfig) {
  const requestCounts = new Map<string, { count: number; resetTime: number }>();

  return async (request: Request, env: any, ctx: ExecutionContext) => {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const now = Date.now();

    // Clean up expired entries
    for (const [key, entry] of requestCounts.entries()) {
      if (entry.resetTime < now) {
        requestCounts.delete(key);
      }
    }

    // Get or create request count for IP
    let ipEntry = requestCounts.get(ip);
    if (!ipEntry || ipEntry.resetTime < now) {
      ipEntry = { count: 0, resetTime: now + config.windowMs };
      requestCounts.set(ip, ipEntry);
    }

    // Increment request count
    ipEntry.count++;

    // Check if rate limit exceeded
    if (ipEntry.count > config.maxRequests) {
      return new Response('Rate limit exceeded', {
        status: 429,
        headers: {
          'Retry-After': Math.ceil(config.blockDurationMs / 1000).toString(),
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': (now + config.blockDurationMs).toString()
        }
      });
    }

    // Continue request processing
    return null;
  };
}
