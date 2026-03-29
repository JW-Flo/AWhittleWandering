import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';

/**
 * Middleware to validate request using express-validator
 * @param validations Array of validation chains
 */
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    return res.status(400).json({
      errors: errors.array(),
      message: 'Validation failed'
    });
  };
};

/**
 * Common validation schemas and utility functions
 */
export const validationSchemas = {
  email: () => {
    return {
      isEmail: {
        errorMessage: 'Invalid email address',
        bail: true
      }
    };
  },
  required: (fieldName: string) => {
    return {
      notEmpty: {
        errorMessage: `${fieldName} is required`,
        bail: true
      }
    };
  },
  minLength: (min: number, fieldName: string) => {
    return {
      isLength: {
        options: { min },
        errorMessage: `${fieldName} must be at least ${min} characters long`
      }
    };
  }
};