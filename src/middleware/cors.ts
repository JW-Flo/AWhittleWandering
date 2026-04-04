import { Request, Response, NextFunction } from 'express';

interface CorsOptions {
  origin?: string | string[] | boolean;
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

export function corsMiddleware(options: CorsOptions = {}) {
  const {
    origin = '*',
    methods = ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    allowedHeaders = ['Content-Type', 'Authorization'],
    exposedHeaders = [],
    credentials = false,
    maxAge = 86400,
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const requestOrigin = req.headers.origin;

    let isOriginAllowed = false;
    if (origin === true || (Array.isArray(origin) && origin.includes(requestOrigin ?? '')) || (typeof origin === 'string' && origin !== '*' && origin === requestOrigin)) {
      isOriginAllowed = true;
    } else if (origin === '*') {
      isOriginAllowed = true;
    }

    if (isOriginAllowed) {
      res.setHeader('Access-Control-Allow-Origin', origin === true || typeof origin === 'string' ? origin : requestOrigin ?? '*');
    }

    if (credentials) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    res.setHeader('Access-Control-Allow-Methods', methods.join(', '));
    res.setHeader('Access-Control-Allow-Headers', allowedHeaders.join(', '));
    if (exposedHeaders.length) {
      res.setHeader('Access-Control-Expose-Headers', exposedHeaders.join(', '));
    }
    if (maxAge) {
      res.setHeader('Access-Control-Max-Age', maxAge.toString());
    }

    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }

    next();
  };
}