import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

interface PrivacyConfig {
  saltKey?: string;
  hashIp?: boolean;
  redactUserAgent?: boolean;
}

const DEFAULT_CONFIG: PrivacyConfig = {
  saltKey: process.env.PRIVACY_SALT || 'default-privacy-salt',
  hashIp: true,
  redactUserAgent: true
};

function hashValue(value: string, salt: string): string {
  return crypto
    .createHash('sha256')
    .update(`${value}${salt}`)
    .digest('hex');
}

function redactUserAgent(userAgent?: string): string {
  return userAgent ? '[REDACTED]' : '';
}

export function privacyMiddleware(config: PrivacyConfig = {}) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  return (req: Request, res: Response, next: NextFunction) => {
    if (mergedConfig.hashIp && req.ip) {
      req.privacyIp = hashValue(req.ip, mergedConfig.saltKey!);
    }

    if (mergedConfig.redactUserAgent && req.get('User-Agent')) {
      req.privacyUserAgent = redactUserAgent(req.get('User-Agent'));
    }

    next();
  };
}

// Extend Request interface to include privacy fields
declare global {
  namespace Express {
    interface Request {
      privacyIp?: string;
      privacyUserAgent?: string;
    }
  }
}
