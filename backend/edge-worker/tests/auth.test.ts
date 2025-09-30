import { describe, it, expect } from 'vitest';
import app from '../src/index';

// Helper to invoke the Hono app
async function call(path: string, init: RequestInit) {
  const req = new Request('http://localhost' + path, init);
  return app.fetch(req, {} as any, {} as any);
}

describe('/api/v1/auth endpoint', () => {
  it('login succeeds', async () => {
    const res = await call('/api/v1/auth', { method: 'POST', body: JSON.stringify({ action: 'login' }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.action).toBe('login');
  });
  it('register succeeds', async () => {
    const res = await call('/api/v1/auth', { method: 'POST', body: JSON.stringify({ action: 'register' }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.action).toBe('register');
  });
  it('invalid action rejected', async () => {
    const res = await call('/api/v1/auth', { method: 'POST', body: JSON.stringify({ action: 'noop' }) });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
  });
  it('legacy /drop still works (deprecation)', async () => {
    const res = await call('/drop', { method: 'POST', body: JSON.stringify({ action: 'login' }) });
    expect(res.status).toBe(200);
    expect(res.headers.get('Deprecation')).toBe('true');
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.action).toBe('login');
  });
});
