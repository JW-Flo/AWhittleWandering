import { Request, Response, NextFunction } from 'express';

interface RateLimitOptions {
  /** Window size in milliseconds (default: 60000 = 1 minute) */
  windowMs?: number;
  /** Max number of requests allowed within windowMs (default: 5) */
  max?: number;
  /** Function to generate a key for identifying clients (default: IP) */
  keyGenerator?: (req: Request) => string;
  /** Custom handler when limit exceeded (default: sends 429) */
  handler?: (req: Request, res: Response, next: NextFunction) => void;
  /** Whether to skip successful responses from counting (default: false) */
  skipSuccessfulResponses?: boolean;
  /** Whether to skip failed responses from counting (default: false) */
  skipFailedResponses?: boolean;
}

interface WindowRecord {
  count: number;
  resetTime: number;
}

/**
 * Fixed-window rate limiter middleware.
 * Uses an in-memory Map to store request counts per key.
 */
export function rateLimit(options: RateLimitOptions = {}) {
  const {
    windowMs = 60_000,
    max = 5,
    keyGenerator = (req) => req.ip ?? 'anonymous',
    handler = defaultHandler,
    skipSuccessfulResponses = false,
    skipFailedResponses = false,
  } = options;

  const store = new Map<string, WindowRecord>();

  // Periodic cleanup to avoid memory leak
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (record.resetTime < now) {
        store.delete(key);
      }
    }
  }, windowMs);

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const record = store.get(key);
    const now = Date.now();

    let shouldLimit = false;

    if (record) {
      if (now < record.resetTime) {
        // Still within current window
        if (record.count >= max) {
          shouldLimit = true;
        } else {
          record.count += 1;
        }
      } else {
        // Window expired, reset
        store.set(key, { count: 1, resetTime: now + windowMs });
      }
    } else {
      // First request for this key
      store.set(key, { count: 1, resetTime: now + windowMs });
    }

    if (shouldLimit) {
      return handler(req, res, next);
    }

    // Attach limit info to response headers (optional)
    const remaining = Math.max(0, max - (record ? record.count : 1));
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', new Date(record ? record.resetTime : now + windowMs).toISOString());

    // After response finishes, optionally adjust count based on skip flags
    const originalSend = res.send;
    res.send = function (body) {
      // Determine if we should revert the increment for this request
      let shouldSkip = false;
      if (skipSuccessfulResponses && res.statusCode >= 200 && res.statusCode < 300) {
        shouldSkip = true;
      }
      if (skipFailedResponses && (res.statusCode < 200 || res.statusCode >= 300)) {
        shouldSkip = true;
      }
      if (shouldSkip && record) {
        record.count = Math.max(0, record.count - 1);
      }
      return originalSend.call(this, body);
    };

    next();
  };
}

function defaultHandler(req: Request, res: Response, next: NextFunction) {
  res.status(429).send({
    error: 'Too Many Requests',
    message: 'Rate limit exceeded',
  });
}
