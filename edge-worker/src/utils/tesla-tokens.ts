/**
 * Tesla token storage helpers for Cloudflare Workers.
 * Uses KV or D1 for secure, persistent storage.
 * 
 * Methods:
 *   - getToken(env): Promise<{ access_token, refresh_token } | null>
 *   - setToken(env, { access_token, refresh_token }): Promise<void>
 */

type TeslaToken = {
  access_token: string;
  refresh_token: string;
};

const TOKEN_KEY = 'tesla_token';

export async function getToken(env: any): Promise<TeslaToken | null> {
  // Prefer D1 if available, fallback to KV
  if (env.DB) {
    // D1 (Cloudflare SQLite)
    const result = await env.DB.prepare(
      'SELECT access_token, refresh_token FROM tokens WHERE key = ?'
    ).bind(TOKEN_KEY).first<TeslaToken>();
    return result || null;
  } else if (env.TESLA_KV) {
    // KV
    const raw = await env.TESLA_KV.get(TOKEN_KEY, 'json');
    return raw as TeslaToken | null;
  }
  throw new Error('No token storage configured');
}

export async function setToken(env: any, token: TeslaToken): Promise<void> {
  if (env.DB) {
    // D1
    await env.DB.prepare(
      'INSERT OR REPLACE INTO tokens (key, access_token, refresh_token) VALUES (?, ?, ?)'
    ).bind(TOKEN_KEY, token.access_token, token.refresh_token).run();
  } else if (env.TESLA_KV) {
    // KV
    await env.TESLA_KV.put(TOKEN_KEY, JSON.stringify(token));
  } else {
    throw new Error('No token storage configured');
  }
}
