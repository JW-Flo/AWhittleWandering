import { Request } from 'express';

/**
 * Extend Express Request interface with custom properties
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
      };
      requestId?: string;
    }
  }
}