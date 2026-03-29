import { Request, Response, NextFunction } from 'express';

/**
 * Security middleware configuration
 */
export class SecurityMiddleware {
  /**
   * Prevent common web vulnerabilities
   * @param req Express request object
   * @param res Express response object
   * @param next Middleware next function
   */
  static securityHeaders(req: Request, res: Response, next: NextFunction): void {
    // TODO: Implement comprehensive security header configuration
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    
    next();
  }

  /**
   * Basic CORS configuration
   * @param req Express request object
   * @param res Express response object
   * @param next Middleware next function
   */
  static corsProtection(req: Request, res: Response, next: NextFunction): void {
    // TODO: Implement more robust CORS configuration
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    
    next();
  }
}

/**
 * Convenience export for direct middleware usage
 */
export const securityMiddleware = {
  headers: SecurityMiddleware.securityHeaders,
  cors: SecurityMiddleware.corsProtection
};
