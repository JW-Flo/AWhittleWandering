import cors from 'cors';
import { Request, Response, NextFunction } from 'express';
import { createCorsOptions, CorsConfiguration } from '../config/cors.config';

export function corsMiddleware(config?: CorsConfiguration) {
  const corsOptions = createCorsOptions(config);
  return cors(corsOptions);
}

export function corsErrorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  if (err.name === 'CorsError') {
    return res.status(403).json({ error: 'CORS policy violation' });
  }
  next(err);
}