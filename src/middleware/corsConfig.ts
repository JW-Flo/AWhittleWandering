import { Request, Response, NextFunction } from 'express';

/**
 * CORS configuration middleware for handling cross-origin requests
 */
export const configureCors = (req: Request, res: Response, next: NextFunction): void => {
  // TODO: Implement dynamic origin validation
  const allowedOrigins: string[] = [
    'http://localhost:3000', 
    'https://yourdomain.com'
  ];

  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  // Standard CORS headers
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }

  next();
};

export default configureCors;