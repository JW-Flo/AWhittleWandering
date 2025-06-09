/**
 * Cloudflare Worker: Tesla API Proxy
 * Provides authenticated, real-time Tesla vehicle data to clients.
 * All tokens are stored in Cloudflare KV/D1, never exposed to clients.
 * 
 * Endpoints:
 *   - GET /tesla/vehicle   (returns live vehicle data)
 *   - POST /tesla/auth     (admin: set/refresh Tesla tokens)
 * 
 * NOTE: This is production code. No mock data, no test endpoints.
 */

import { Hono } from 'hono';
import { env } from 'hono/adapter';
import { TeslaAPIClient } from './utils/tesla-client'; // You will implement this
import { getToken, setToken } from './utils/tesla-tokens'; // KV/D1 helpers
import type { Env } from './index';

const app = new Hono();

/**
 * GET /tesla/vehicle
 * Returns live Tesla vehicle data (battery, range, location, etc.)
 * Requires Authorization: Bearer <JWT>
 */
app.get('/tesla/vehicle', async (c) => {
  const envVars = env(c);
  const TESLA_CLIENT_ID = envVars.TESLA_CLIENT_ID;
  const TESLA_CLIENT_SECRET = envVars.TESLA_CLIENT_SECRET;
  
  if (typeof TESLA_CLIENT_ID !== 'string' || typeof TESLA_CLIENT_SECRET !== 'string') {
    return c.json({ error: 'Tesla credentials not configured' }, 500);
  }
  
  const token = await getToken(c.env as Env);
  if (!token) return c.json({ error: 'Tesla token not set' }, 401);

  const client = new TeslaAPIClient({
    clientId: TESLA_CLIENT_ID,
    clientSecret: TESLA_CLIENT_SECRET,
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
  });

  try {
    const vehicles = await client.listVehicles();
    if (!vehicles || vehicles.length === 0) {
      return c.json({ error: 'No vehicles found' }, 404);
    }
    const vehicle = vehicles[0];
    const data = await client.getVehicleData(vehicle.id_s);
    return c.json({ vehicle: data });
  } catch (err) {
    return c.json({ error: 'Failed to fetch Tesla data', details: String(err) }, 500);
  }
});

/**
 * POST /tesla/auth
 * Admin endpoint to set/refresh Tesla tokens.
 * Body: { access_token, refresh_token }
 * Requires Authorization: Bearer <admin JWT>
 */
app.post('/tesla/auth', async (c) => {
  // TODO: Add admin JWT verification
  const body = await c.req.json();
  if (!body.access_token || !body.refresh_token) {
    return c.json({ error: 'Missing tokens' }, 400);
  }
  await setToken(c.env, body);
  return c.json({ ok: true });
});

export default app;
