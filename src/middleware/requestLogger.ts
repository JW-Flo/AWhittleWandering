import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const requestId = crypto.randomUUID();
  req.requestId = requestId;
  console.log(`[${requestId}] ${req.method} ${req.path}`);

  const originalSend = res.send.bind(res);
  res.send = function (body?: any) {
    console.log(`[${requestId}] ${req.method} ${req.path} ${res.statusCode}`);
    return originalSend(body);
  };

  next();
}
