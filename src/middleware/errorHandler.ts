import { Request, Response, NextFunction } from 'express';

interface ErrorResponse {
  statusCode: number;
  message: string;
  stack?: string;
}

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  const errorResponse: ErrorResponse = {
    statusCode: res.statusCode === 200 ? 500 : res.statusCode,
    message: err.message || 'Internal Server Error',
  };

  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  console.error(err);
  res.status(errorResponse.statusCode).json(errorResponse);
};

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};