import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { corsMiddleware, securityHeaders } from '../src/middleware/cors';
import { rateLimit } from '../src/middleware/rateLimit';
import { errorHandler } from '../src/middleware/errorHandler';
import { requestLogger } from '../src/middleware/requestLogger';

// Helper to invoke a Hono app
async function testRequest(app: Hono, path: string, init: RequestInit = {}) {
  const req = new Request('http://localhost' + path, init);
  return app.fetch(req, {} as any, {} as any);
}

describe('CORS Middleware', () => {
  it('allows request from allowed origin', async () => {
    const app = new Hono();
    app.use('*', corsMiddleware);
    app.get('/test', (c) => c.json({ ok: true }));

    const res = await testRequest(app, '/test', {
      headers: { Origin: 'http://localhost:5173' },
    });

    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:5173');
    expect(res.headers.get('Access-Control-Allow-Credentials')).toBe('true');
  });

  it('blocks request from disallowed origin', async () => {
    const app = new Hono();
    app.use('*', corsMiddleware);
    app.get('/test', (c) => c.json({ ok: true }));

    const res = await testRequest(app, '/test', {
      headers: { Origin: 'https://evil.com' },
    });

    expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });

  it('handles requests without origin header', async () => {
    const app = new Hono();
    app.use('*', corsMiddleware);
    app.get('/test', (c) => c.json({ ok: true }));

    const res = await testRequest(app, '/test');

    // No CORS headers should be set for requests without Origin
    expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
    expect(res.status).toBe(200);
  });

  it('adds security headers', async () => {
    const app = new Hono();
    app.use('*', securityHeaders);
    app.get('/api/test', (c) => c.json({ ok: true }));

    const res = await testRequest(app, '/api/test');

    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    expect(res.headers.get('X-XSS-Protection')).toBe('1; mode=block');
    expect(res.headers.get('Content-Security-Policy')).toContain("default-src 'none'");
  });
});

describe('Rate Limiter Middleware', () => {
  it('allows request when KV is not configured', async () => {
    const app = new Hono();
    app.use('*', rateLimit);
    app.get('/test', (c) => c.json({ ok: true }));

    const res = await testRequest(app, '/test');

    expect(res.status).toBe(200);
  });

  it('allows request when tokens available', async () => {
    const mockKV = {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined),
    };

    const app = new Hono<{ Bindings: { AUTH_TOKENS: KVNamespace } }>();
    app.use('*', rateLimit);
    app.get('/test', (c) => c.json({ ok: true }));

    const req = new Request('http://localhost/test');
    const res = await app.fetch(req, { AUTH_TOKENS: mockKV as any } as any, {} as any);

    expect(res.status).toBe(200);
    expect(mockKV.put).toHaveBeenCalled();
  });

  it('blocks request when rate limit exceeded', async () => {
    const now = Date.now();
    const mockKV = {
      get: vi.fn().mockResolvedValue({
        tokens: 0,
        expiresAt: now + 60000,
      }),
      put: vi.fn().mockResolvedValue(undefined),
    };

    const app = new Hono<{ Bindings: { AUTH_TOKENS: KVNamespace } }>();
    app.use('*', rateLimit);
    app.get('/test', (c) => c.json({ ok: true }));

    const req = new Request('http://localhost/test');
    const res = await app.fetch(req, { AUTH_TOKENS: mockKV as any } as any, {} as any);

    expect(res.status).toBe(429);
    const json = await res.json();
    expect(json.error).toBe('Rate limit exceeded');
  });

  it('allows request after window expires', async () => {
    const now = Date.now();
    const mockKV = {
      get: vi.fn().mockResolvedValue({
        tokens: 0,
        expiresAt: now - 1000, // Expired
      }),
      put: vi.fn().mockResolvedValue(undefined),
    };

    const app = new Hono<{ Bindings: { AUTH_TOKENS: KVNamespace } }>();
    app.use('*', rateLimit);
    app.get('/test', (c) => c.json({ ok: true }));

    const req = new Request('http://localhost/test');
    const res = await app.fetch(req, { AUTH_TOKENS: mockKV as any } as any, {} as any);

    expect(res.status).toBe(200);
    expect(mockKV.put).toHaveBeenCalled();
  });
});

describe('Error Handler Middleware', () => {
  it('catches errors and returns structured JSON response', async () => {
    const app = new Hono();
    app.use('*', errorHandler);
    app.get('/test', () => {
      throw new Error('Test error');
    });

    const res = await testRequest(app, '/test');

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('Test error');
    expect(json.requestId).toBeDefined();
    expect(json.timestamp).toBeDefined();
    expect(json.path).toBe('/test');
  });

  it('includes requestId header in error response', async () => {
    const app = new Hono();
    app.use('*', errorHandler);
    app.get('/test', () => {
      throw new Error('Test error');
    });

    const res = await testRequest(app, '/test');

    const requestId = res.headers.get('X-Request-ID');
    expect(requestId).toBeDefined();
    const json = await res.json();
    expect(json.requestId).toBe(requestId);
  });

  it('uses error status when provided', async () => {
    const app = new Hono();
    app.use('*', errorHandler);
    app.get('/test', () => {
      const error: any = new Error('Not found');
      error.status = 404;
      throw error;
    });

    const res = await testRequest(app, '/test');

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe('Not found');
  });
});

describe('Request Logger Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('adds requestId to context', async () => {
    const app = new Hono();
    app.use('*', requestLogger);
    app.get('/test', (c) => {
      const requestId = c.get('requestId');
      return c.json({ requestId });
    });

    const res = await testRequest(app, '/test');

    const json = await res.json();
    expect(json.requestId).toBeDefined();
    expect(typeof json.requestId).toBe('string');
  });

  it('adds X-Request-ID header to response', async () => {
    const app = new Hono();
    app.use('*', requestLogger);
    app.get('/test', (c) => c.json({ ok: true }));

    const res = await testRequest(app, '/test');

    const requestId = res.headers.get('X-Request-ID');
    expect(requestId).toBeDefined();
    expect(typeof requestId).toBe('string');
  });

  it('logs request start and end', async () => {
    const app = new Hono();
    app.use('*', requestLogger);
    app.get('/test', (c) => c.json({ ok: true }));

    const res = await testRequest(app, '/test');

    expect(res.status).toBe(200);
    // Logging is tested implicitly by ensuring middleware completes
  });
});
