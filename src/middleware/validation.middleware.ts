import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

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
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: error.errors
        });
      }
      next(error);
    }
  };
};
