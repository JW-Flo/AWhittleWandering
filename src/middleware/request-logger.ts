import { Request, Response, NextFunction } from 'express';

interface LoggerOptions {
  level?: 'info' | 'warn' | 'error';
  includeBody?: boolean;
}

class RequestLogger {
  private options: LoggerOptions;

  constructor(options: LoggerOptions = {}) {
    this.options = {
      level: options.level || 'info',
      includeBody: options.includeBody || false
    };
  }

  public middleware = (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();

    // TODO: Implement more advanced logging mechanism
    this.logRequest(req);

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      this.logResponse(req, res, duration);
    });

    next();
  }

  private logRequest(req: Request): void {
    const logEntry = {
      method: req.method,
      path: req.path,
      timestamp: new Date().toISOString(),
      body: this.options.includeBody ? req.body : undefined
    };

    console[this.options.level || 'info'](JSON.stringify(logEntry));
  }

  private logResponse(req: Request, res: Response, duration: number): void {
    const logEntry = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
      timestamp: new Date().toISOString()
    };

    console[this.options.level || 'info'](JSON.stringify(logEntry));
  }
}

export default RequestLogger;
