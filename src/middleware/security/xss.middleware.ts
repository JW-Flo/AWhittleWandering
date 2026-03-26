import xss from 'xss';
import { Request, Response, NextFunction } from 'express';

interface SanitizedRequest extends Request {
  sanitizedBody?: any;
  sanitizedQuery?: any;
}

export const xssMiddleware = (req: SanitizedRequest, res: Response, next: NextFunction) => {
  if (req.body) {
    req.sanitizedBody = Object.keys(req.body).reduce((acc, key) => {
      acc[key] = typeof req.body[key] === 'string' ? xss(req.body[key]) : req.body[key];
      return acc;
    }, {} as any);
  }

  if (req.query) {
    req.sanitizedQuery = Object.keys(req.query).reduce((acc, key) => {
      acc[key] = typeof req.query[key] === 'string' ? xss(req.query[key] as string) : req.query[key];
      return acc;
    }, {} as any);
  }

  next();
};

export const xssErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof Error) {
    res.status(400).json({ error: 'Invalid input detected' });
  } else {
    next(err);
  }
};