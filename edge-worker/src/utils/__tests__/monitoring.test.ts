import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  MetricsCollector,
  HealthChecker,
  RequestLogger,
  registerDefaultHealthChecks,
  withMonitoring
} from '../monitoring';
import { WorkerEnvironment } from '../../types/cloudflare';

describe('MetricsCollector', () => {
  let collector: MetricsCollector;

  beforeEach(() => {
    collector = new MetricsCollector();
    vi.useFakeTimers();
  });

  it('should record metrics with tags', () => {
    collector.recordMetric('test_metric', 100, { env: 'test' });
    
    const allMetrics = collector.getMetrics();
    expect(allMetrics).toHaveLength(1);
    expect(allMetrics[0].name).toBe('test_metric');
    expect(allMetrics[0].value).toBe(100);
    expect(allMetrics[0].tags).toEqual({ env: 'test' });
  });

  it('should filter metrics by name', () => {
    collector.recordMetric('metric_a', 100);
    collector.recordMetric('metric_b', 200);
    collector.recordMetric('metric_a', 150);
    
    const filtered = collector.getMetrics('metric_a');
    expect(filtered).toHaveLength(2);
    expect(filtered.every(m => m.name === 'metric_a')).toBe(true);
  });

  it('should filter metrics by time window', () => {
    const now = Date.now();
    vi.setSystemTime(now);
    
    collector.recordMetric('test', 100);
    
    vi.advanceTimersByTime(30000); // 30 seconds
    collector.recordMetric('test', 200);
    
    const recent = collector.getMetrics('test', now + 15000);
    expect(recent).toHaveLength(1);
    expect(recent[0].value).toBe(200);
  });

  it('should calculate aggregates correctly', () => {
    collector.recordMetric('latency', 100);
    collector.recordMetric('latency', 200);
    collector.recordMetric('latency', 300);
    collector.recordMetric('latency', 400);
    collector.recordMetric('latency', 500);
    
    const agg = collector.getAggregates('latency');
    expect(agg).toEqual({
      count: 5,
      sum: 1500,
      avg: 300,
      min: 100,
      max: 500,
      p50: 300,
      p95: 500,
      p99: 500
    });
  });

  it('should limit stored metrics', () => {
    // Record more than max metrics
    for (let i = 0; i < 1100; i++) {
      collector.recordMetric('test', i);
    }
    
    const allMetrics = collector.getMetrics();
    expect(allMetrics.length).toBe(1000);
    expect(allMetrics[0].value).toBe(100); // First 100 should be removed
  });
});

describe('HealthChecker', () => {
  let checker: HealthChecker;

  beforeEach(() => {
    checker = new HealthChecker();
  });

  it('should register and run health checks', async () => {
    checker.registerCheck('test_check', async () => {
      // Add a small delay to ensure latency > 0
      await new Promise(resolve => setTimeout(resolve, 1));
      return {
        status: 'pass',
        message: 'All good'
      };
    });
    
    const result = await checker.runChecks();
    
    expect(result.status).toBe('healthy');
    expect(result.checks.test_check.status).toBe('pass');
    expect(result.checks.test_check.message).toBe('All good');
    expect(result.checks.test_check.latency).toBeGreaterThanOrEqual(0);
  });

  it('should handle failing checks', async () => {
    checker.registerCheck('failing_check', async () => ({
      status: 'fail',
      message: 'Something wrong'
    }));
    
    checker.registerCheck('passing_check', async () => ({
      status: 'pass'
    }));
    
    const result = await checker.runChecks();
    
    expect(result.status).toBe('degraded');
    expect(result.checks.failing_check.status).toBe('fail');
    expect(result.checks.passing_check.status).toBe('pass');
  });

  it('should handle check exceptions', async () => {
    checker.registerCheck('error_check', async () => {
      throw new Error('Check failed');
    });
    
    const result = await checker.runChecks();
    
    expect(result.status).toBe('unhealthy');
    expect(result.checks.error_check.status).toBe('fail');
    expect(result.checks.error_check.message).toBe('Check failed');
  });

  it('should report unhealthy when multiple checks fail', async () => {
    checker.registerCheck('check1', async () => ({ status: 'fail' }));
    checker.registerCheck('check2', async () => ({ status: 'fail' }));
    checker.registerCheck('check3', async () => ({ status: 'pass' }));
    
    const result = await checker.runChecks();
    
    expect(result.status).toBe('unhealthy');
  });
});

describe('RequestLogger', () => {
  let logger: RequestLogger;

  beforeEach(() => {
    logger = new RequestLogger();
    vi.useFakeTimers();
  });

  it('should log requests', () => {
    logger.logRequest('GET', '/api/test', 200, 150);
    logger.logRequest('POST', '/api/test', 201, 200, 'Created');
    
    const logs = logger.getRecentLogs();
    expect(logs).toHaveLength(2);
    expect(logs[0].method).toBe('GET');
    expect(logs[1].error).toBe('Created');
  });

  it('should calculate error rate', () => {
    const now = Date.now();
    vi.setSystemTime(now);
    
    logger.logRequest('GET', '/api/test', 200, 100);
    logger.logRequest('GET', '/api/test', 404, 100);
    logger.logRequest('GET', '/api/test', 500, 100);
    logger.logRequest('GET', '/api/test', 200, 100);
    
    const errorRate = logger.getErrorRate(60000);
    expect(errorRate).toBe(0.5); // 2 errors out of 4 requests
  });

  it('should calculate average latency', () => {
    logger.logRequest('GET', '/api/test', 200, 100);
    logger.logRequest('GET', '/api/test', 200, 200);
    logger.logRequest('GET', '/api/test', 200, 300);
    
    const avgLatency = logger.getAverageLatency(60000);
    expect(avgLatency).toBe(200);
  });

  it('should limit stored logs', () => {
    // Log more than max
    for (let i = 0; i < 600; i++) {
      logger.logRequest('GET', `/api/test${i}`, 200, 100);
    }
    
    const logs = logger.getRecentLogs(600);
    expect(logs.length).toBe(500);
  });
});

describe('registerDefaultHealthChecks', () => {
  it('should register KV namespace check', async () => {
    const mockEnv: Partial<WorkerEnvironment> = {
      APP_KV: {
        get: vi.fn().mockResolvedValue('test-value'),
        put: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined),
        list: vi.fn().mockResolvedValue({ keys: [], list_complete: true, cursor: '' })
      },
      ITINERARY_KV: {
        get: vi.fn().mockResolvedValue('test-value'),
        put: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined),
        list: vi.fn().mockResolvedValue({ keys: [], list_complete: true, cursor: '' })
      }
    };
    
    const checker = new HealthChecker();
    const globalWithHealth = global as typeof global & { health?: HealthChecker };
    const originalHealth = globalWithHealth.health;
    globalWithHealth.health = checker;
    
    try {
      // Register health checks with mocked KV namespaces
      registerDefaultHealthChecks(mockEnv as WorkerEnvironment);
      
      // Run health checks
      const result = await checker.runChecks();
      
      // Verify KV namespace checks are registered and passing
      expect(result.checks['kv-namespace']).toBeDefined();
      expect(result.checks['kv-namespace'].status).toBe('pass');
      expect(mockEnv.APP_KV?.get).toHaveBeenCalled();
      expect(mockEnv.ITINERARY_KV?.get).toHaveBeenCalled();
    } finally {
      globalWithHealth.health = originalHealth;
    }
  });
});

describe('withMonitoring', () => {
  it('should track successful requests', async () => {
    const handler = vi.fn().mockResolvedValue(new Response('OK', { status: 200 }));
    const monitoredHandler = withMonitoring(handler);
    
    const request = new Request('https://example.com/api/test');
    const env = {} as WorkerEnvironment;
    
    const response = await monitoredHandler(request, env);
    
    expect(response.status).toBe(200);
    expect(handler).toHaveBeenCalledWith(request, env, undefined);
  });

  it('should track failed requests', async () => {
    const handler = vi.fn().mockRejectedValue(new Error('Handler error'));
    const monitoredHandler = withMonitoring(handler);
    
    const request = new Request('https://example.com/api/test');
    const env = {} as WorkerEnvironment;
    
    await expect(monitoredHandler(request, env)).rejects.toThrow('Handler error');
    expect(handler).toHaveBeenCalledWith(request, env, undefined);
  });

  it('should pass through context parameter', async () => {
    const handler = vi.fn().mockResolvedValue(new Response('OK'));
    const monitoredHandler = withMonitoring(handler);
    
    const request = new Request('https://example.com/api/test');
    const env = {} as WorkerEnvironment;
    const ctx = { waitUntil: vi.fn() };
    
    await monitoredHandler(request, env, ctx);
    
    expect(handler).toHaveBeenCalledWith(request, env, ctx);
  });
});
