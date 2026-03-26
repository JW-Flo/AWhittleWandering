import { Request, Response, NextFunction } from 'express';

/**
 * CORS middleware configuration
 */
export interface CorsOptions {
  allowedOrigins?: string[];
  allowedMethods?: string[];
  allowedHeaders?: string[];
  maxAge?: number;
}

/**
 * Default CORS configuration
 */
const defaultCorsOptions: CorsOptions = {
  allowedOrigins: ['*'],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 3600
};

/**
 * CORS middleware to handle Cross-Origin Resource Sharing
 * @param options Custom CORS configuration options
 * @returns Express middleware function
 */
export function corsMiddleware(options: CorsOptions = {}): (req: Request, res: Response, next: NextFunction) => void {
  const config: CorsOptions = { ...defaultCorsOptions, ...options };

  return (req: Request, res: Response, next: NextFunction): void => {
    // TODO: Implement more granular origin validation
    const origin = req.get('origin');

    // Set CORS headers
    res.header('Access-Control-Allow-Origin', config.allowedOrigins?.includes('*') ? '*' : origin);
    res.header('Access-Control-Allow-Methods', config.allowedMethods?.join(', '));
    res.header('Access-Control-Allow-Headers', config.allowedHeaders?.join(', '));
    res.header('Access-Control-Max-Age', config.maxAge?.toString());

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }

    next();
  };
}
