import { z } from 'zod';

interface RateLimiterOptions {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitState {
  count: number;
  resetTime: number;
}

export function createRateLimiter(options: RateLimiterOptions) {
  const { maxRequests, windowMs } = options;

  return async (request: Request, env: any, ctx: ExecutionContext) => {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const key = `rate-limit:${ip}`;

    // Retrieve or initialize rate limit state
    const stateJson = await env.RATE_LIMIT_KV.get(key);
    const currentTime = Date.now();
    let state: RateLimitState = stateJson ? JSON.parse(stateJson) : { count: 0, resetTime: currentTime + windowMs };

    // Check if reset is needed
    if (currentTime >= state.resetTime) {
      state = { count: 0, resetTime: currentTime + windowMs };
    }

    // Check rate limit
    if (state.count >= maxRequests) {
      return new Response('Too Many Requests', { 
        status: 429,
        headers: { 'Retry-After': Math.ceil((state.resetTime - currentTime) / 1000).toString() }
      });
    }

    // Increment request count
    state.count += 1;

    // Store updated state
    await env.RATE_LIMIT_KV.put(key, JSON.stringify(state), { expirationTtl: Math.ceil(windowMs / 1000) });

    return null; // Allow request to proceed
  };
}

// Predefined rate limit configurations
export const RATE_LIMIT_CONFIGS = {
  STRICT: { maxRequests: 10, windowMs: 60000 }, // 10 requests per minute
  MODERATE: { maxRequests: 50, windowMs: 60000 }, // 50 requests per minute
  LENIENT: { maxRequests: 100, windowMs: 60000 } // 100 requests per minute
};
