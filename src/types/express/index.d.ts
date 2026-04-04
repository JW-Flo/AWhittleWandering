declare global {
  namespace Express {
    interface Request {
      rateLimitKey?: string;
    }
  }
}

export {};
