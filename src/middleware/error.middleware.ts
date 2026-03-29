import { Request, Response, NextFunction } from 'express';

interface ErrorResponse {
  statusCode: number;
  message: string;
  stack?: string;
}

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  const errorResponse: ErrorResponse = {
    statusCode: res.statusCode || 500,
    message: err.message || 'Internal Server Error'
  };

  // Only include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  console.error(err);
  res.status(errorResponse.statusCode).json(errorResponse);
};

// Catch 404 routes
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
};
