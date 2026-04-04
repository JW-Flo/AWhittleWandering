import { Request, Response, NextFunction } from 'express';

/**
 * Request logging middleware for tracking incoming HTTP requests
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  // TODO: Consider adding configurable log levels
  console.log('[REQUEST] ${req.method} ${req.url}');

  // Capture original response methods to log response details
  const originalEnd = res.end;
  res.end = function(...args: any[]): Response {
    const duration = Date.now() - startTime;

    // TODO: Implement more robust logging (e.g., to file or logging service)
    console.log('[RESPONSE] ${req.method} ${req.url} - Status: ${res.statusCode} - Duration: ${duration}ms');

    return originalEnd.apply(this, args);
  };

  next();
}

export default requestLogger;