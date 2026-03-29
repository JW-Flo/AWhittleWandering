import { Request, Response, NextFunction } from 'express';

/**
 * CORS middleware configuration
 */
export const configureCORS = (req: Request, res: Response, next: NextFunction): void => {
  // TODO: Configure allowed origins dynamically
  const allowedOrigins: string[] = [
    'http://localhost:3000', 
    'https://yourdomain.com'
  ];

  const origin = req.headers.origin || '';

  // Check if origin is in allowed list
  if (allowedOrigins.includes(origin)) {
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

export default configureCORS;