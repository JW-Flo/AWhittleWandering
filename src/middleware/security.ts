import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { validationResult } from 'express-validator';

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later'
});

// Security middleware class
export class SecurityMiddleware {
  // Basic request validation middleware
  static validateRequest(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }

  // CSRF protection middleware
  static csrfProtection(req: Request, res: Response, next: NextFunction) {
    // Implement CSRF token validation logic
    // This is a placeholder - integrate with your specific CSRF strategy
    if (!req.headers['x-csrf-token']) {
      return res.status(403).json({ error: 'CSRF token missing' });
    }
    next();
  }

  // Input sanitization middleware
  static sanitizeInput(req: Request, res: Response, next: NextFunction) {
    // Basic input sanitization
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    });
    next();
  }

  // Combine multiple security middlewares
  static securityStack() {
    return [
      helmet(), // Set various HTTP headers for security
      limiter, // Rate limiting
      this.sanitizeInput, // Input sanitization
    ];
  }

  // Validate and sanitize specific input types
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePassword(password: string): boolean {
    // Strong password: min 8 chars, at least 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    return passwordRegex.test(password);
  }
}
