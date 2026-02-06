import { describe, it, expect } from 'vitest';
import app from '../src/index';

async function call(path: string, init: RequestInit = {}) {
  const req = new Request('http://localhost' + path, init);
  return app.fetch(req, {} as any, {} as any);
}

describe('Platform surface area (no bindings)', () => {
  it('/api/v1/unified-data returns frontend contract shape (soft-fail)', async () => {
    const res = await call('/api/v1/unified-data');
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json).toHaveProperty('overview');
    expect(json).toHaveProperty('currentStatus');
    expect(json).toHaveProperty('timeline');
    expect(json).toHaveProperty('liveData');
    expect(json).toHaveProperty('tessieStatus');

    expect(json.overview).toHaveProperty('tripName');
    expect(json.overview).toHaveProperty('startDate');
    expect(json.overview).toHaveProperty('totalMiles');
    expect(json.currentStatus).toHaveProperty('battery');
    expect(json.currentStatus).toHaveProperty('location');
    expect(Array.isArray(json.timeline?.drives)).toBe(true);
    expect(Array.isArray(json.timeline?.charges)).toBe(true);
  });

  it('/api/v1/meta/routes is available', async () => {
    const res = await call('/api/v1/meta/routes');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.endpoints).toBeTruthy();
  });

  it('frontend trip-status alias exists', async () => {
    const res = await call('/api/v1/trip/status');
    expect(res.status).toBe(301);
    expect(res.headers.get('location')).toBe('/api/v1/trip-status');
  });

  it('legacy /unified-data redirects permanently', async () => {
    const res = await call('/unified-data');
    expect(res.status).toBe(301);
    expect(res.headers.get('location')).toBe('/api/v1/unified-data');
  });

  it('legacy /trip-status redirects permanently', async () => {
    const res = await call('/trip-status');
    expect(res.status).toBe(301);
    expect(res.headers.get('location')).toBe('/api/v1/trip-status');
  });

  it('component and analytics endpoints return 200 (degraded mode)', async () => {
    const comp = await call('/api/v1/component/overview');
    expect(comp.status).toBe(200);
    const compJson = await comp.json();
    expect(compJson.ok).toBe(false);

    const ana = await call('/api/v1/analytics/comprehensive');
    expect(ana.status).toBe(200);
    const anaJson = await ana.json();
    expect(anaJson.ok).toBe(false);
  });

  it('vehicle enhanced state endpoint returns 200 (degraded mode)', async () => {
    const res = await call('/api/v1/vehicle/state/enhanced');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(false);
  });
});

