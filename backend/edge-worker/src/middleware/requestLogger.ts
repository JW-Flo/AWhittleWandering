import { Context, Next } from 'hono';

// Basic logging functions (simplified from utils/log.ts)
let currentCorrelationId: string | undefined;

export function setCorrelationId(id: string | undefined) {
  currentCorrelationId = id;
}

export function log(level: string, event: string, payload?: any) {
  const logEntry = {
    level,
    event,
    correlationId: currentCorrelationId,
    timestamp: new Date().toISOString(),
    ...payload
  };
  console.log(JSON.stringify(logEntry));
}

export async function requestLogger(c: Context, next: Next) {
  const cid = crypto.randomUUID();
  setCorrelationId(cid);
  const start = Date.now();
  
  log('info', 'request.start', { 
    correlationId: cid, 
    method: c.req.method, 
    path: c.req.path 
  });

  try {
    await next();
    log('info', 'request.end', { 
      correlationId: cid, 
      status: c.res.status, 
      durationMs: Date.now() - start 
    });
  } catch (err) {
    log('error', 'request.error', { 
      correlationId: cid, 
      error: (err as any)?.message 
    });
    throw err;
  } finally {
    setCorrelationId(undefined);
  }
}

export async function analyticsLogger(c: Context, next: Next) {
  const start = Date.now();
  const ip = c.req.header('CF-Connecting-IP') || 'unknown';
  const userAgent = c.req.header('User-Agent') || 'unknown';
  
  await next();
  
  const duration = Date.now() - start;
  
  // Write to Analytics Engine if available
  try {
    if (c.env?.TELEMETRY_ANALYTICS) {
      c.env.TELEMETRY_ANALYTICS.writeDataPoint({
        blobs: [
          c.req.method,
          c.req.url,
          ip,
          userAgent.substring(0, 100),
          c.res.status.toString()
        ],
        doubles: [duration, c.res.status],
        indexes: [c.req.method, c.res.status.toString()]
      });
    }
  } catch (error) {
    console.error('Analytics write failed:', error);
  }
  
  // Also log to D1 if available
  try {
    if (c.env?.TESLA_DB) {
      await c.env.TESLA_DB.prepare(`
        INSERT INTO analytics_events 
        (event_type, event_data, user_ip, user_agent, processing_time_ms, status_code)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        'api_call',
        JSON.stringify({
          method: c.req.method,
          path: new URL(c.req.url).pathname,
          query: new URL(c.req.url).search
        }),
        ip,
        userAgent,
        duration,
        c.res.status
      ).run();
    }
  } catch (error) {
    console.error('Failed to log analytics:', error);
  }
}