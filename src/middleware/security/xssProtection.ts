import { Request, Response, NextFunction } from 'express';

class XSSProtection {
  private static sanitizeInput(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const sanitizeObject = (obj: any) => {
        if (typeof obj === 'string') {
          return XSSProtection.sanitizeInput(obj);
        }

        if (obj && typeof obj === 'object') {
          for (const key in obj) {
            obj[key] = sanitizeObject(obj[key]);
          }
        }

        return obj;
      };

      req.body = sanitizeObject(req.body);
      req.query = sanitizeObject(req.query);
      req.params = sanitizeObject(req.params);

      next();
    };
  }
}

export default XSSProtection;
