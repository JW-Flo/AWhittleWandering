import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

interface ValidationOptions {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export const validateRequest = (options: ValidationOptions) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (options.body) {
        options.body.parse(req.body);
      }
      if (options.query) {
        options.query.parse(req.query);
      }
      if (options.params) {
        options.params.parse(req.params);
      }
      next();
    } catch (error) {
      res.status(400).json({
        error: 'Validation Failed',
        details: error instanceof Error ? error.message : 'Invalid request data'
      });
    }
  };
};
