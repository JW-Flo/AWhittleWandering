import { Context, Next } from 'hono';

/**
 * KV-backed rate limiter for Cloudflare Workers.
 *
 * Uses the AUTH_TOKENS KV namespace to persist counters across isolates.
 * Each key stores the remaining token count and expiry timestamp.
 * Falls back to allow-through if KV is unavailable (resilient degradation).
 */

interface RateLimitBucket {
  tokens: number;
  expiresAt: number; // epoch ms
}

const MAX_TOKENS = 100;
const WINDOW_SECONDS = 60; // 1-minute sliding window
const KV_TTL_SECONDS = WINDOW_SECONDS + 10; // KV entry TTL (slightly longer than window)

async function kvCanProceed(kv: KVNamespace, ip: string): Promise<boolean> {
  const key = `ratelimit:${ip}`;
  const now = Date.now();

  const raw = await kv.get(key, 'json') as RateLimitBucket | null;

  if (!raw || now >= raw.expiresAt) {
    // New window — grant a token and start fresh
    const bucket: RateLimitBucket = {
      tokens: MAX_TOKENS - 1,
      expiresAt: now + WINDOW_SECONDS * 1000,
    };
    await kv.put(key, JSON.stringify(bucket), { expirationTtl: KV_TTL_SECONDS });
    return true;
  }

  if (raw.tokens >= 1) {
    raw.tokens -= 1;
    // Write back with remaining TTL
    const remainingSec = Math.max(1, Math.ceil((raw.expiresAt - now) / 1000));
    await kv.put(key, JSON.stringify(raw), { expirationTtl: remainingSec + 5 });
    return true;
  }

  return false;
}

export async function rateLimit(c: Context, next: () => Promise<void>) {
  const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
  const kv = (c.env as Record<string, unknown>)?.AUTH_TOKENS as KVNamespace | undefined;

  if (!kv) {
    // No KV configured — allow through (local dev / missing binding)
    await next();
    return;
  }

  try {
    const allowed = await kvCanProceed(kv, ip);
    if (!allowed) {
      return c.json({ error: 'Rate limit exceeded' }, 429);
    }
  } catch {
    // KV failure — fail open to avoid blocking all traffic
  }

  await next();
}

// Legacy exports preserved for backward compatibility
export function canProceed(_ip: string): boolean {
  // Synchronous check is no longer meaningful with KV;
  // retained only so existing imports don't break at compile time.
  return true;
}

export function recordCall(_ip: string): void {
  // No-op — counting is handled inside the middleware.
}
