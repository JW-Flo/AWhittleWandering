import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';

const helmetOptions = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    }
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  frameguard: { action: 'deny' }
};

export const helmetMiddleware = helmet(helmetOptions);

export const helmetErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof Error) {
    res.status(500).json({ error: 'Security configuration error' });
  } else {
    next(err);
  }
};