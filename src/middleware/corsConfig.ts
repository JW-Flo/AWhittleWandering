import { Request, Response, NextFunction } from 'express';

interface CorsOptions {
  allowedOrigins?: string[];
  allowedMethods?: string[];
  allowedHeaders?: string[];
  maxAge?: number;
}

const defaultCorsOptions: CorsOptions = {
  allowedOrigins: ['http://localhost:3000'],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 3600
};

export function configureCors(options: CorsOptions = {}) {
  const mergedOptions: CorsOptions = { ...defaultCorsOptions, ...options };

  return (req: Request, res: Response, next: NextFunction) => {
    // TODO: Implement dynamic origin validation
    const origin = req.headers.origin || '';
    const isAllowedOrigin = mergedOptions.allowedOrigins?.includes(origin);

    if (isAllowedOrigin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', mergedOptions.allowedMethods?.join(', ') || '');
      res.setHeader('Access-Control-Allow-Headers', mergedOptions.allowedHeaders?.join(', ') || '');
      res.setHeader('Access-Control-Max-Age', mergedOptions.maxAge?.toString() || '');
    }

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }

    next();
  };
}

export default configureCors;
