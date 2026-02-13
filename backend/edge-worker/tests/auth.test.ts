import { describe, it, expect, vi } from 'vitest';
import { Hono } from 'hono';
import { authRouter } from '../src/routers/auth';
import type { AppContext } from '../src/types/env';

// Helper to create mock D1 database
function createMockD1() {
  return {
    prepare: vi.fn((query: string) => ({
      bind: vi.fn().mockReturnThis(),
      first: vi.fn().mockResolvedValue(null),
      all: vi.fn().mockResolvedValue({ results: [] }),
      run: vi.fn().mockResolvedValue({ success: true }),
    })),
  };
}

// Helper to invoke the auth router
async function testRequest(path: string, init: RequestInit, env: any = {}) {
  const app = new Hono<AppContext>();
  app.route('/api/v1/auth', authRouter);
  const req = new Request('http://localhost' + path, init);
  return app.fetch(req, env, {} as any);
}

describe('/api/v1/auth endpoint', () => {
  it('returns 500 when database not configured', async () => {
    const res = await testRequest('/api/v1/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', email: 'user@example.com', password: 'validpassword123' }),
    });

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error).toContain('Database not configured');
  });

  it('returns 400 for invalid email', async () => {
    const mockDb = createMockD1();
    const res = await testRequest(
      '/api/v1/auth',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email: 'invalid-email', password: 'validpassword123' }),
      },
      { TESLA_DB: mockDb }
    );

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error).toBe('Validation failed');
  });

  it('returns 400 for short password', async () => {
    const mockDb = createMockD1();
    const res = await testRequest(
      '/api/v1/auth',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email: 'user@example.com', password: 'short' }),
      },
      { TESLA_DB: mockDb }
    );

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error).toBe('Validation failed');
  });

  it('returns 400 for invalid action', async () => {
    const mockDb = createMockD1();
    const res = await testRequest(
      '/api/v1/auth',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'noop', email: 'user@example.com', password: 'validpassword123' }),
      },
      { TESLA_DB: mockDb }
    );

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error).toBe('Validation failed');
  });

  it('returns 401 for login with non-existent user', async () => {
    const mockDb = createMockD1();
    mockDb.prepare = vi.fn(() => ({
      bind: vi.fn().mockReturnThis(),
      first: vi.fn().mockResolvedValue(null),
      all: vi.fn().mockResolvedValue({ results: [] }),
      run: vi.fn().mockResolvedValue({ success: true }),
    }));

    const res = await testRequest(
      '/api/v1/auth',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email: 'nonexistent@example.com', password: 'validpassword123' }),
      },
      { TESLA_DB: mockDb }
    );

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error).toBe('Invalid credentials');
  });

  it('returns 401 for login with incorrect password', async () => {
    const mockDb = createMockD1();
    mockDb.prepare = vi.fn(() => ({
      bind: vi.fn().mockReturnThis(),
      first: vi.fn().mockResolvedValue({
        id: 'user-123',
        email: 'user@example.com',
        display_name: 'Test User',
        is_admin: 0,
        role: 'user',
        password_hash: 'hash123',
        password_salt: 'salt123',
        password_algo: 'pbkdf2_sha256_v1',
      }),
      all: vi.fn().mockResolvedValue({ results: [] }),
      run: vi.fn().mockResolvedValue({ success: true }),
    }));

    const res = await testRequest(
      '/api/v1/auth',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email: 'user@example.com', password: 'wrongpassword123' }),
      },
      { TESLA_DB: mockDb }
    );

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error).toBe('Invalid credentials');
  });

  it('returns 201 for successful registration', async () => {
    const mockDb = createMockD1();
    mockDb.prepare = vi.fn((query: string) => {
      if (query.includes('INSERT INTO users')) {
        return {
          bind: vi.fn().mockReturnThis(),
          first: vi.fn().mockResolvedValue(null),
          all: vi.fn().mockResolvedValue({ results: [] }),
          run: vi.fn().mockResolvedValue({ success: true }),
        };
      }
      // For role lookup
      return {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ role: 'user', is_admin: 0 }),
        all: vi.fn().mockResolvedValue({ results: [] }),
        run: vi.fn().mockResolvedValue({ success: true }),
      };
    });

    const res = await testRequest(
      '/api/v1/auth',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          email: 'newuser@example.com',
          password: 'validpassword123',
          displayName: 'New User',
        }),
      },
      { TESLA_DB: mockDb, JWT_SECRET: 'test-secret-key-for-jwt-signing' }
    );

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.action).toBe('register');
    expect(json.user).toBeDefined();
    expect(json.user.email).toBe('newuser@example.com');
    expect(json.token).toBeDefined();
    expect(json.token).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
  });

  it('returns 400 for duplicate registration', async () => {
    const mockDb = createMockD1();
    mockDb.prepare = vi.fn(() => ({
      bind: vi.fn().mockReturnThis(),
      first: vi.fn().mockResolvedValue(null),
      all: vi.fn().mockResolvedValue({ results: [] }),
      run: vi.fn().mockRejectedValue(new Error('UNIQUE constraint failed: users.email')),
    }));

    const res = await testRequest(
      '/api/v1/auth',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          email: 'existing@example.com',
          password: 'validpassword123',
        }),
      },
      { TESLA_DB: mockDb }
    );

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error).toBe('Registration failed');
  });
});
