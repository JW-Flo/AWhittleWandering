import { describe, it, expect } from 'vitest';
import app from '../src/index';

function makeEnv() {
  // Minimal D1 stub to avoid blowing up router wiring tests.
  // Real logic is covered by integration tests later with Miniflare D1.
  return {
    TESLA_DB: {
      prepare() {
        return {
          bind() {
            return this;
          },
          async first() {
            return null;
          },
          async all() {
            return { results: [], success: true, meta: { duration: 0, size_after: 0, rows_read: 0, rows_written: 0 } };
          },
          async run() {
            return { results: [], success: true, meta: { duration: 0, size_after: 0, rows_read: 0, rows_written: 0 } };
          },
        } as any;
      },
    },
    JWT_SECRET: 'test-secret',
    JWT_SECRET_PREVIOUS: '',
  } as any;
}

async function call(path: string, init: RequestInit, env = makeEnv()) {
  const req = new Request('http://localhost' + path, init);
  return app.fetch(req, env, {} as any);
}

describe('notifications + push route wiring', () => {
  it('GET /api/v1/notifications requires auth', async () => {
    const res = await call('/api/v1/notifications', { method: 'GET' });
    expect(res.status).toBe(401);
  });

  it('POST /api/v1/push/subscribe requires auth', async () => {
    const res = await call('/api/v1/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    expect(res.status).toBe(401);
  });
});


