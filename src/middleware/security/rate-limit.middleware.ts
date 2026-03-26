import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

const rateLimitOptions = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later.'
};

export const rateLimitMiddleware = rateLimit(rateLimitOptions);

export const rateLimitErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err.message === 'Too many requests, please try again later.') {
    res.status(429).json({ error: 'Rate limit exceeded' });
  } else {
    next(err);
  }
};