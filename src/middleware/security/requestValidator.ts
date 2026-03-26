import { Request, Response, NextFunction } from 'express';

interface ValidationRule {
  validate: (value: any) => boolean;
  errorMessage: string;
}

class RequestValidator {
  private rules: Record<string, ValidationRule[]> = {};

  addRule(field: string, rule: ValidationRule): void {
    if (!this.rules[field]) {
      this.rules[field] = [];
    }
    this.rules[field].push(rule);
  }

  validate(req: Request): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    Object.keys(this.rules).forEach(field => {
      const value = this.extractValue(req, field);
      const fieldRules = this.rules[field];

      fieldRules.forEach(rule => {
        if (!rule.validate(value)) {
          errors.push(`${field}: ${rule.errorMessage}`);
        }
      });
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private extractValue(req: Request, field: string): any {
    return req.body[field] || req.query[field] || req.params[field];
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const validationResult = this.validate(req);

      if (!validationResult.isValid) {
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: validationResult.errors
        });
      }

      next();
    };
  }
}

export default RequestValidator;
