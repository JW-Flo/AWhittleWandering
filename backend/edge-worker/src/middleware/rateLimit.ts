import { Context } from 'hono';

// Simple in-memory rate limiter
class RateLimiter {
  private buckets = new Map<string, { tokens: number; lastRefill: number }>();
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per second

  constructor(maxTokens = 100, refillRate = 10) {
    this.maxTokens = maxTokens;
    this.refillRate = refillRate;
  }

  canProceed(ip: string): boolean {
    const now = Date.now();
    let bucket = this.buckets.get(ip);

    if (!bucket) {
      bucket = { tokens: this.maxTokens - 1, lastRefill: now };
      this.buckets.set(ip, bucket);
      return true;
    }

    // Refill tokens based on time passed
    const timePassed = (now - bucket.lastRefill) / 1000;
    bucket.tokens = Math.min(this.maxTokens, bucket.tokens + (timePassed * this.refillRate));
    bucket.lastRefill = now;

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return true;
    }

    return false;
  }

  recordCall(ip: string): void {
    // This is handled in canProceed for the simple implementation
  }
}

export const rateLimiter = new RateLimiter();

export async function rateLimit(c: Context, next: () => Promise<void>) {
  const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
  
  if (!rateLimiter.canProceed(ip)) {
    return c.json({ error: 'Rate limit exceeded' }, 429);
  }

  await next();
}

// Legacy functions for compatibility
export function canProceed(ip: string): boolean {
  return rateLimiter.canProceed(ip);
}

export function recordCall(ip: string): void {
  rateLimiter.recordCall(ip);
}