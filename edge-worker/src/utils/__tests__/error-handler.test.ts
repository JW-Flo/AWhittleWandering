import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  CircuitBreaker, 
  ErrorMonitor, 
  withRetry, 
  RateLimiter 
} from '../error-handler';

describe('CircuitBreaker', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should allow requests when circuit is closed', async () => {
    const breaker = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeout: 60000,
      monitoringPeriod: 300000
    });

    const fn = vi.fn().mockResolvedValue('success');
    const result = await breaker.execute(fn);
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalled();
  });

  it('should open circuit after failure threshold', async () => {
    const breaker = new CircuitBreaker({
      failureThreshold: 2,
      resetTimeout: 60000,
      monitoringPeriod: 300000
    });

    const fn = vi.fn().mockRejectedValue(new Error('fail'));
    
    // First two failures
    await expect(breaker.execute(fn)).rejects.toThrow('fail');
    await expect(breaker.execute(fn)).rejects.toThrow('fail');
    
    // Circuit should be open now
    await expect(breaker.execute(fn)).rejects.toThrow('Circuit breaker is OPEN');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should transition to half-open after reset timeout', async () => {
    const breaker = new CircuitBreaker({
      failureThreshold: 1,
      resetTimeout: 60000,
      monitoringPeriod: 300000
    });

    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success');
    
    // Trigger circuit open
    await expect(breaker.execute(fn)).rejects.toThrow('fail');
    
    // Should be open
    await expect(breaker.execute(fn)).rejects.toThrow('Circuit breaker is OPEN');
    
    // Advance time past reset timeout
    vi.advanceTimersByTime(61000);
    
    // Should allow request (half-open) and succeed
    const result = await breaker.execute(fn);
    expect(result).toBe('success');
    expect(breaker.getState().state).toBe('CLOSED');
  });
});

describe('ErrorMonitor', () => {
  it('should record errors with context', () => {
    const monitor = new ErrorMonitor();
    const error = new Error('Test error');
    const context = { userId: '123', action: 'test' };
    
    monitor.recordError(error, context);
    
    const errors = monitor.getErrors();
    expect(errors).toHaveLength(1);
    expect(errors[0].error).toBe('Test error');
    expect(errors[0].context).toEqual(context);
  });

  it('should calculate error rate correctly', () => {
    const monitor = new ErrorMonitor();
    
    // Record 5 errors
    for (let i = 0; i < 5; i++) {
      monitor.recordError(new Error(`Error ${i}`));
    }
    
    const rate = monitor.getErrorRate(60000);
    expect(rate).toBe(5);
  });

  it('should limit stored errors to 100', () => {
    const monitor = new ErrorMonitor();
    
    // Record 150 errors
    for (let i = 0; i < 150; i++) {
      monitor.recordError(new Error(`Error ${i}`));
    }
    
    const errors = monitor.getErrors();
    expect(errors).toHaveLength(100);
    expect(errors[0].error).toBe('Error 50'); // First 50 should be removed
  });
});

describe('withRetry', () => {
  it('should succeed on first attempt', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    
    const result = await withRetry(fn, 3, 100);
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success');
    
    const result = await withRetry(fn, 3, 100);
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should throw after max retries', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'));
    
    await expect(withRetry(fn, 3, 100)).rejects.toThrow('fail');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should use exponential backoff', async () => {
    vi.useFakeTimers();
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success');
    
    const promise = withRetry(fn, 3, 100);
    
    // First attempt
    expect(fn).toHaveBeenCalledTimes(1);
    
    // Wait for first backoff (100ms)
    await vi.advanceTimersByTimeAsync(100);
    expect(fn).toHaveBeenCalledTimes(2);
    
    // Wait for second backoff (200ms)
    await vi.advanceTimersByTimeAsync(200);
    expect(fn).toHaveBeenCalledTimes(3);
    
    const result = await promise;
    expect(result).toBe('success');
  });
});

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should allow requests within limit', () => {
    const limiter = new RateLimiter(5, 60000);
    
    for (let i = 0; i < 5; i++) {
      expect(limiter.canMakeRequest()).toBe(true);
    }
    
    // 6th request should be denied
    expect(limiter.canMakeRequest()).toBe(false);
  });

  it('should reset after window expires', () => {
    const limiter = new RateLimiter(2, 60000);
    
    expect(limiter.canMakeRequest()).toBe(true);
    expect(limiter.canMakeRequest()).toBe(true);
    expect(limiter.canMakeRequest()).toBe(false);
    
    // Advance time past window
    vi.advanceTimersByTime(61000);
    
    expect(limiter.canMakeRequest()).toBe(true);
  });

  it('should provide accurate status', () => {
    const limiter = new RateLimiter(3, 60000);
    
    limiter.canMakeRequest();
    limiter.canMakeRequest();
    
    const status = limiter.getStatus();
    expect(status.current).toBe(2);
    expect(status.max).toBe(3);
    expect(status.windowMs).toBe(60000);
  });
});
