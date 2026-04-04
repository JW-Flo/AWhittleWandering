import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

interface PrivacyOptions {
  /** Length to truncate user agent string; default 100 */
  userAgentTruncateLength?: number;
  /** Whether to hash IP address; default true */
  hashIP?: boolean;
}

/**
 * Middleware that prepares privacy‑safe request data for logging.
 * It adds `req.hashedIP` (SHA‑256 of the IP) and `req.truncatedUserAgent`
 * (user agent truncated to a safe length) to the request object.
 */
export function privacyMiddleware(options: PrivacyOptions = {}): (req: Request, res: Response, next: NextFunction) => NextFunction {
  const {
    userAgentTruncateLength = 100,
    hashIP = true,
  } = options;

  return (req, res, next) => {
    // Determine IP address (supports proxy trust via `req.ip` set by express)
    const ip = req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || '';
    if (hashIP && ip) {
      const hash = crypto.createHash('sha256').update(ip).digest('hex');
      req.hashedIP = hash;
    } else {
      req.hashedIP = ip; // fallback: raw IP if hashing disabled
    }

    // Truncate user agent
    const userAgent = req.get('user-agent') || '';
    req.truncatedUserAgent = userAgent.slice(0, userAgentTruncateLength);

    next();
  };
}

/**
 * Utility function that returns a privacy‑safe loggable object from a request.
 * Useful when you want to log request details without exposing raw IP or full UA.
 */
export function sanitizeRequestInfo(req: Request): { hashedIP?: string; truncatedUserAgent?: string } {
  return {
    hashedIP: req.hashedIP,
    truncatedUserAgent: req.truncatedUserAgent,
  };
}
