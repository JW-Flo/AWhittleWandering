import { Request, Response } from 'worktop';

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
  handler?: (req: Request) => Response | Promise<Response>;
}

interface RateLimitData {
  count: number;
  resetTime: number;
}

const defaultKeyGenerator = (req: Request): string => {
  // Try to get IP from common headers
  const ip = 
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';
  return ip;
};

export function rateLimit(options: RateLimitOptions) {
  const {
    windowMs = 60000, // 1 minute
    maxRequests = 100,
    keyGenerator = defaultKeyGenerator,
    skip,
    handler
  } = options;

  const store = new Map<string, RateLimitData>();

  return async (req: Request, env: Env, ctx: ExecutionContext): Promise<Response | undefined> => {
    if (skip && skip(req)) {
      return undefined;
    }

    const key = keyGenerator(req);
    const now = Date.now();
    const data = store.get(key) || { count: 0, resetTime: now + windowMs };

    // Reset if window has passed
    if (now > data.resetTime) {
      data.count = 0;
      data.resetTime = now + windowMs;
    }

    data.count += 1;
    store.set(key, data);

    if (data.count > maxRequests) {
      const retryAfter = Math.ceil((data.resetTime - now) / 1000);
      if (handler) {
        return await handler(req);
      }
      return new Response('Too Many Requests', {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(new Date(data.resetTime).toISOString()),
        },
      });
    }

    // Add rate limit headers to response
    const remaining = Math.max(0, maxRequests - data.count);
    return undefined;
  };
}
