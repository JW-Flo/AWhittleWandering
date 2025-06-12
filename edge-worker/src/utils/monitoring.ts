/**
 * Monitoring and telemetry utilities for the edge worker
 * Enhanced with structured logging, error tracking, and monitoring integration
 */

import { WorkerEnvironment } from '../types/cloudflare';

type LogLevel = 'info' | 'warning' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  [key: string]: any; // Additional context fields
}

export interface MetricData {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  checks: {
    [key: string]: {
      status: 'pass' | 'fail';
      message?: string;
      latency?: number;
    };
  };
}

/**
 * Log an informational message
 * @param data - Log data with message and optional context
 */
export function logInfo(data: { message: string; [key: string]: unknown }): void {
  logMessage('info', data);
}

/**
 * Log a warning message
 * @param data - Log data with message and optional context
 */
export function logWarning(data: { message: string; [key: string]: unknown }): void {
  logMessage('warning', data);
}

/**
 * Log an error message with stack trace and context
 * @param data - Error data with message, error object, and optional context
 */
export function logError(data: { 
  message: string; 
  operation?: string;
  error?: string;
  stack?: string;
  [key: string]: unknown;
}): void {
  logMessage('error', data);
}

/**
 * Log a debug message (only in development or when debug is enabled)
 * @param data - Log data with message and optional context
 */
export function logDebug(data: { message: string; [key: string]: unknown }): void {
  // Only log debug messages in development or when debug is enabled
  const isDebugMode = 
    typeof process !== 'undefined' && 
    process.env && 
    (process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true');
    
  if (isDebugMode) {
    logMessage('debug', data);
  }
}

/**
 * Format and output a log message
 * @param level - Log level (info, warning, error, debug)
 * @param data - Log data with message and context
 */
function logMessage(level: LogLevel, data: { message: string; [key: string]: unknown }): void {
  const { message, ...context } = data;
  
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context
  };
  
  // Format log output for console
  const formattedMessage = formatLogMessage(entry);
  
  // Output to console with appropriate method
  switch (level) {
    case 'error':
      console.error(formattedMessage);
      break;
    case 'warning':
      console.warn(formattedMessage);
      break;
    case 'debug':
      console.debug(formattedMessage);
      break;
    case 'info':
    default:
      console.log(formattedMessage);
  }
  
  // In a production environment, we could send logs to a monitoring service
  // This would be implemented in sendToMonitoringService
}

/**
 * Format a log entry for console output
 * @param entry - Log entry to format
 * @returns Formatted log message
 */
function formatLogMessage(entry: LogEntry): string {
  // Extract key fields
  const { timestamp, level, message, ...context } = entry;
  
  // Format the basic message
  let formattedMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  
  // Add context if available
  if (Object.keys(context).length > 0) {
    formattedMessage += '\n' + JSON.stringify(context, null, 2);
  }
  
  return formattedMessage;
}

export class MetricsCollector {
  private metrics: MetricData[] = [];
  private readonly maxMetrics = 1000;

  recordMetric(name: string, value: number, tags?: Record<string, string>) {
    this.metrics.push({
      name,
      value,
      timestamp: Date.now(),
      tags
    });

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  getMetrics(name?: string, since?: number): MetricData[] {
    let filtered = this.metrics;
    
    if (name) {
      filtered = filtered.filter(m => m.name === name);
    }
    
    if (since) {
      filtered = filtered.filter(m => m.timestamp >= since);
    }
    
    return filtered;
  }

  getAggregates(name: string, windowMs: number = 60000) {
    const now = Date.now();
    const metrics = this.getMetrics(name, now - windowMs);
    
    if (metrics.length === 0) {
      return null;
    }
    
    const values = metrics.map(m => m.value);
    const sum = values.reduce((a, b) => a + b, 0);
    
    return {
      count: metrics.length,
      sum,
      avg: sum / metrics.length,
      min: Math.min(...values),
      max: Math.max(...values),
      p50: this.percentile(values, 0.5),
      p95: this.percentile(values, 0.95),
      p99: this.percentile(values, 0.99)
    };
  }

  private percentile(values: number[], p: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[index] || 0;
  }

  clear() {
    this.metrics = [];
  }
}

export class HealthChecker {
  private checks: Map<string, () => Promise<{ status: 'pass' | 'fail'; message?: string }>> = new Map();

  registerCheck(name: string, check: () => Promise<{ status: 'pass' | 'fail'; message?: string }>) {
    this.checks.set(name, check);
  }

  async runChecks(): Promise<HealthCheckResult> {
    const results: HealthCheckResult['checks'] = {};
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    const checkEntries = Array.from(this.checks.entries());
    for (const [name, check] of checkEntries) {
      const start = Date.now();
      try {
        const result = await check();
        results[name] = {
          ...result,
          latency: Date.now() - start
        };
        
        if (result.status === 'fail') {
          overallStatus = overallStatus === 'healthy' ? 'degraded' : 'unhealthy';
        }
      } catch (error) {
        results[name] = {
          status: 'fail',
          message: error instanceof Error ? error.message : 'Unknown error',
          latency: Date.now() - start
        };
        overallStatus = 'unhealthy';
      }
    }
    
    return {
      status: overallStatus,
      timestamp: Date.now(),
      checks: results
    };
  }
}

export class RequestLogger {
  private logs: Array<{
    timestamp: number;
    method: string;
    path: string;
    status: number;
    duration: number;
    error?: string;
  }> = [];
  private readonly maxLogs = 500;

  logRequest(
    method: string,
    path: string,
    status: number,
    duration: number,
    error?: string
  ) {
    this.logs.push({
      timestamp: Date.now(),
      method,
      path,
      status,
      duration,
      error
    });

    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  getRecentLogs(count: number = 100): typeof this.logs {
    return this.logs.slice(-count);
  }

  getErrorRate(windowMs: number = 300000): number {
    const now = Date.now();
    const recentLogs = this.logs.filter(log => now - log.timestamp < windowMs);
    if (recentLogs.length === 0) return 0;
    
    const errors = recentLogs.filter(log => log.status >= 400);
    return errors.length / recentLogs.length;
  }

  getAverageLatency(windowMs: number = 300000): number {
    const now = Date.now();
    const recentLogs = this.logs.filter(log => now - log.timestamp < windowMs);
    if (recentLogs.length === 0) return 0;
    
    const totalDuration = recentLogs.reduce((sum, log) => sum + log.duration, 0);
    return totalDuration / recentLogs.length;
  }
}

// Global instances
export const metrics = new MetricsCollector();
export const health = new HealthChecker();
export const requestLogger = new RequestLogger();

// Register default health checks
export function registerDefaultHealthChecks(env: WorkerEnvironment, healthChecker: HealthChecker = health) {
  // Check KV namespace accessibility
  healthChecker.registerCheck('kv-namespace', async () => {
    try {
      await env.APP_KV.get('health-check-test');
      return { status: 'pass' };
    } catch (error) {
      return { 
        status: 'fail', 
        message: 'KV namespace not accessible' 
      };
    }
  });

  // Check external API connectivity (example with weather API)
  healthChecker.registerCheck('weather-api', async () => {
    try {
      const response = await fetch('https://api.openweathermap.org/data/2.5/weather?lat=0&lon=0&appid=test', {
        signal: AbortSignal.timeout(5000)
      });
      return { 
        status: response.status === 401 ? 'pass' : 'fail',
        message: response.status === 401 ? 'API accessible' : 'Unexpected response'
      };
    } catch (error) {
      return { 
        status: 'fail', 
        message: 'Weather API not reachable' 
      };
    }
  });
}

// Middleware for request tracking
export function withMonitoring<T extends (request: Request, env: WorkerEnvironment, ctx?: unknown) => Promise<Response>>(
  handler: T
): T {
  return (async (request: Request, env: WorkerEnvironment, ctx?: unknown) => {
    const start = Date.now();
    const url = new URL(request.url);
    
    try {
      const response = await handler(request, env, ctx);
      const duration = Date.now() - start;
      
      requestLogger.logRequest(
        request.method,
        url.pathname,
        response.status,
        duration
      );
      
      metrics.recordMetric('request_duration', duration, {
        method: request.method,
        path: url.pathname,
        status: response.status.toString()
      });
      
      return response;
    } catch (error) {
      const duration = Date.now() - start;
      
      requestLogger.logRequest(
        request.method,
        url.pathname,
        500,
        duration,
        error instanceof Error ? error.message : 'Unknown error'
      );
      
      metrics.recordMetric('request_errors', 1, {
        method: request.method,
        path: url.pathname
      });
      
      throw error;
    }
  }) as T;
}
