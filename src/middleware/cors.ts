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
  maxAge: 86400
};

export function corsMiddleware(options: CorsOptions = {}) {
  const mergedOptions: CorsOptions = {
    ...defaultCorsOptions,
    ...options
  };

  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.get('origin');

    // Check if origin is allowed
    if (origin && mergedOptions.allowedOrigins) {
      const isOriginAllowed = mergedOptions.allowedOrigins.includes(origin);
      
      if (isOriginAllowed) {
        res.header('Access-Control-Allow-Origin', origin);
      } else {
        return res.status(403).json({ error: 'Origin not allowed' });
      }
    }

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.header('Access-Control-Allow-Methods', mergedOptions.allowedMethods?.join(', '));
      res.header('Access-Control-Allow-Headers', mergedOptions.allowedHeaders?.join(', '));
      res.header('Access-Control-Max-Age', mergedOptions.maxAge?.toString());
      return res.status(204).end();
    }

    // Standard CORS headers
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Vary', 'Origin');

    next();
  };
}
