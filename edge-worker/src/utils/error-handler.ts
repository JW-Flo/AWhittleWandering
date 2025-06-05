/**
 * Error handling utilities with circuit breaker pattern
 */

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
}

export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(private config: CircuitBreakerConfig) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      const now = Date.now();
      if (now - this.lastFailureTime > this.config.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await fn();
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        this.failures = 0;
      }
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }
  
  private recordFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.config.failureThreshold) {
      this.state = 'OPEN';
    }
  }
  
  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    };
  }
}

export interface ErrorContext {
  [key: string]: unknown;
}

export class ErrorMonitor {
  private errors: Array<{
    timestamp: number;
    error: string;
    context: ErrorContext;
  }> = [];
  
  recordError(error: Error, context: ErrorContext = {}) {
    this.errors.push({
      timestamp: Date.now(),
      error: error.message,
      context
    });
    
    // Keep only last 100 errors
    if (this.errors.length > 100) {
      this.errors = this.errors.slice(-100);
    }
  }
  
  getErrorRate(periodMs: number = 60000): number {
    const now = Date.now();
    const recentErrors = this.errors.filter(e => now - e.timestamp < periodMs);
    return recentErrors.length;
  }
  
  getErrors() {
    return this.errors;
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  backoffMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await fn();
      return result;
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await new Promise(r => setTimeout(r, backoffMs * Math.pow(2, i)));
      }
    }
  }
  
  throw lastError;
}

export class RateLimiter {
  private requests: number[] = [];
  
  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}
  
  canMakeRequest(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }
    
    return false;
  }
  
  getStatus() {
    const now = Date.now();
    const activeRequests = this.requests.filter(time => now - time < this.windowMs);
    return {
      current: activeRequests.length,
      max: this.maxRequests,
      windowMs: this.windowMs
    };
  }
}
