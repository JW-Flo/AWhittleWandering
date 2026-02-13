import { describe, it, expect, vi } from 'vitest';
import { Hono } from 'hono';
import { healthRouter } from '../src/routers/health';
import { journeysRouter } from '../src/routers/journeys';
import { analyticsRouter } from '../src/routers/analytics';
import { aiRouter } from '../src/routers/ai';
import type { Env } from '../src/types/env';

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

// Helper to create mock KV namespace
function createMockKV() {
  return {
    get: vi.fn().mockResolvedValue(null),
    put: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    list: vi.fn().mockResolvedValue({ keys: [] }),
  };
}

// Helper to create mock R2 bucket
function createMockR2() {
  return {
    list: vi.fn().mockResolvedValue({ objects: [] }),
    get: vi.fn().mockResolvedValue(null),
    put: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  };
}

// Helper to invoke router
async function testRequest(router: Hono<any>, path: string, init: RequestInit = {}, env: Partial<Env> = {}) {
  const req = new Request('http://localhost' + path, init);
  return router.fetch(req, env as any, {} as any);
}

describe('Health Router', () => {
  it('returns health check without database', async () => {
    const res = await testRequest(healthRouter, '/');

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBeDefined();
    expect(json.timestamp).toBeDefined();
    expect(json.version).toBeDefined();
  });

  it('checks D1 database connectivity', async () => {
    const mockDb = createMockD1();
    mockDb.prepare = vi.fn((query: string) => ({
      first: vi.fn().mockResolvedValue({ 1: 1 }),
      bind: vi.fn().mockReturnThis(),
      all: vi.fn().mockResolvedValue({ results: [] }),
      run: vi.fn().mockResolvedValue({ success: true }),
    }));

    const res = await testRequest(healthRouter, '/', {}, { TESLA_DB: mockDb as any });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.resources.d1_database).toBe('operational');
  });

  it('handles D1 database errors', async () => {
    const mockDb = createMockD1();
    mockDb.prepare = vi.fn(() => ({
      first: vi.fn().mockRejectedValue(new Error('Database error')),
      bind: vi.fn().mockReturnThis(),
      all: vi.fn().mockResolvedValue({ results: [] }),
      run: vi.fn().mockResolvedValue({ success: true }),
    }));

    const res = await testRequest(healthRouter, '/', {}, { TESLA_DB: mockDb as any });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe('degraded');
    expect(json.resources.d1_database).toBe('error');
  });

  it('checks R2 storage connectivity', async () => {
    const mockDb = createMockD1();
    mockDb.prepare = vi.fn(() => ({
      first: vi.fn().mockResolvedValue({ 1: 1 }),
      bind: vi.fn().mockReturnThis(),
      all: vi.fn().mockResolvedValue({ results: [] }),
      run: vi.fn().mockResolvedValue({ success: true }),
    }));
    const mockR2 = createMockR2();

    const res = await testRequest(
      healthRouter,
      '/',
      {},
      { TESLA_DB: mockDb as any, MEDIA_BUCKET: mockR2 as any }
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.resources.r2_storage).toBe('operational');
  });
});

describe('Journeys Router', () => {
  it('requires authentication for listing journeys', async () => {
    const res = await testRequest(journeysRouter, '/');

    expect(res.status).toBe(401);
  });

  it('requires authentication for following journey', async () => {
    const res = await testRequest(journeysRouter, '/test-journey-id/follow', {
      method: 'POST',
    });

    expect(res.status).toBe(401);
  });

  it('returns error when database not configured for follow', async () => {
    const app = new Hono();
    app.use('*', async (c, next) => {
      c.set('user', { id: 'test-user-id', email: 'test@example.com' });
      await next();
    });
    app.route('/', journeysRouter);

    const res = await testRequest(app, '/test-journey/follow', {
      method: 'POST',
    });

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error).toContain('Database not configured');
  });
});

describe('Analytics Router', () => {
  it('returns error when database not configured', async () => {
    const res = await testRequest(analyticsRouter, '/summary');

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error).toContain('Database not configured');
  });

  it('returns analytics summary with mocked data', async () => {
    const mockDb = createMockD1();
    mockDb.prepare = vi.fn((query: string) => {
      if (query.includes('FROM drives')) {
        return {
          bind: vi.fn().mockReturnThis(),
          first: vi.fn().mockResolvedValue({
            total_drives: 10,
            total_distance: 500,
            total_energy: 125,
          }),
          all: vi.fn().mockResolvedValue({ results: [] }),
          run: vi.fn().mockResolvedValue({ success: true }),
        };
      }
      if (query.includes('FROM charges')) {
        return {
          bind: vi.fn().mockReturnThis(),
          first: vi.fn().mockResolvedValue({
            total_charges: 5,
            total_energy_added: 130,
            total_cost: 25.5,
          }),
          all: vi.fn().mockResolvedValue({ results: [] }),
          run: vi.fn().mockResolvedValue({ success: true }),
        };
      }
      return {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
        all: vi.fn().mockResolvedValue({ results: [] }),
        run: vi.fn().mockResolvedValue({ success: true }),
      };
    });

    const res = await testRequest(analyticsRouter, '/summary', {}, { TESLA_DB: mockDb as any });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.totalDistance).toBe(500);
    expect(json.totalEnergy).toBe(125);
    expect(json.averageEfficiency).toBe(4);
    expect(json.totalDrives).toBe(10);
    expect(json.totalCharges).toBe(5);
  });

  it('handles query parameters', async () => {
    const mockDb = createMockD1();
    mockDb.prepare = vi.fn(() => ({
      bind: vi.fn().mockReturnThis(),
      first: vi.fn().mockResolvedValue({
        total_drives: 0,
        total_distance: 0,
        total_energy: 0,
        total_charges: 0,
        total_energy_added: 0,
        total_cost: 0,
      }),
      all: vi.fn().mockResolvedValue({ results: [] }),
      run: vi.fn().mockResolvedValue({ success: true }),
    }));

    const res = await testRequest(
      analyticsRouter,
      '/summary?limit=30&journeyId=custom-journey',
      {},
      { TESLA_DB: mockDb as any }
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.journeyId).toBe('custom-journey');
  });
});

describe('AI Router', () => {
  it('returns 503 when AI not configured', async () => {
    const res = await testRequest(aiRouter, '/route/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        start: { lat: 37.7749, lng: -122.4194 },
        end: { lat: 34.0522, lng: -118.2437 },
      }),
    });

    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error).toContain('AI not configured');
  });

  it('validates route optimization request body', async () => {
    const mockAI = {
      run: vi.fn().mockResolvedValue({ response: 'Mock AI response' }),
    };

    const res = await testRequest(
      aiRouter,
      '/route/optimize',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start: { lat: 'invalid' },
          end: { lng: -118.2437 },
        }),
      },
      { AI: mockAI as any }
    );

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error).toContain('Validation failed');
  });

  it('processes valid route optimization request', async () => {
    const mockAI = {
      run: vi.fn().mockResolvedValue({ response: 'Optimized route data' }),
    };

    const res = await testRequest(
      aiRouter,
      '/route/optimize',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start: { lat: 37.7749, lng: -122.4194 },
          end: { lat: 34.0522, lng: -118.2437 },
          waypoints: [{ lat: 36.7783, lng: -119.4179 }],
        }),
      },
      { AI: mockAI as any }
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(mockAI.run).toHaveBeenCalled();
  });

  it('returns 503 for journal generation when AI not configured', async () => {
    const res = await testRequest(aiRouter, '/journal/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: '2024-01-15',
        highlights: ['Visited Grand Canyon'],
      }),
    });

    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error).toContain('AI not configured');
  });

  it('handles malformed JSON body', async () => {
    const res = await testRequest(aiRouter, '/route/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json',
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error).toContain('Malformed JSON');
  });
});
