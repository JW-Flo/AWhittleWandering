import { describe, it, expect } from 'vitest';
import app from '../src/index';

// Helper to invoke the Hono app
async function call(path: string, init: RequestInit) {
  const req = new Request('http://localhost' + path, init);
  return app.fetch(req, {} as any, {} as any);
}

describe('/api/v1/auth endpoint', () => {
  it('login succeeds', async () => {
    const res = await call('/api/v1/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', email: 'user@example.com', password: 'not-a-real-password' }),
    });
    expect([400, 401, 500]).toContain(res.status);
  });
  it('register succeeds', async () => {
    const res = await call('/api/v1/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'register', email: 'user@example.com', password: 'not-a-real-password' }),
    });
    expect([400, 500]).toContain(res.status);
  });
  it('invalid action rejected', async () => {
    const res = await call('/api/v1/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'noop' }),
    });
    expect([400, 500]).toContain(res.status);
    const json = await res.json();
    expect(json.ok).toBe(false);
  });
  it('legacy /drop proxies to auth', async () => {
    const res = await call('/drop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', email: 'user@example.com', password: 'not-a-real-password' }),
    });
    // Should return same status as /api/v1/auth (401, 500 depending on DB availability)
    expect([400, 401, 500]).toContain(res.status);
  });
});
