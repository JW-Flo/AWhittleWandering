import { Express } from 'express';
import { securityMiddleware } from '../middleware/security';

// Centralized security configuration
export const configureSecurity = (app: Express) => {
  // Apply security middleware in a centralized manner
  app.use(securityMiddleware.helmet);
  app.use(securityMiddleware.cors);
  app.use(securityMiddleware.rateLimit);
  app.use(securityMiddleware.xssProtection);

  // Global error handler
  app.use(securityMiddleware.errorHandler);
};
