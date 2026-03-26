import cors from 'cors';
import { Request, Response, NextFunction } from 'express';

const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

export const corsMiddleware = cors(corsOptions);

export const corsErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof Error) {
    res.status(403).json({ error: 'CORS policy violation' });
  } else {
    next(err);
  }
};