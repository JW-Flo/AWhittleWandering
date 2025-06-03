/**
 * Email subscriber storage for Cloudflare Workers.
 * Uses KV or D1 for persistent, production-grade storage.
 * 
 * Methods:
 *   - getSubscribers(env): Promise<string[]>
 *   - addSubscriber(env, email): Promise<void>
 */

const SUBSCRIBERS_KEY = 'email_subscribers';

export async function getSubscribers(env: any): Promise<string[]> {
  if (env.DB) {
    // D1 (Cloudflare SQLite)
    const result = await env.DB.prepare(
      'SELECT email FROM subscribers'
    ).all<{ email: string }>();
    return result.results.map((row: { email: string }) => row.email);
  } else if (env.TESLA_KV) {
    // KV
    const raw = await env.TESLA_KV.get(SUBSCRIBERS_KEY, 'json');
    return Array.isArray(raw) ? raw : [];
  }
  throw new Error('No subscriber storage configured');
}

export async function addSubscriber(env: any, email: string): Promise<void> {
  if (env.DB) {
    // D1
    await env.DB.prepare(
      'INSERT OR IGNORE INTO subscribers (email) VALUES (?)'
    ).bind(email).run();
  } else if (env.TESLA_KV) {
    // KV
    const raw = await env.TESLA_KV.get(SUBSCRIBERS_KEY, 'json');
    const list = Array.isArray(raw) ? raw : [];
    if (!list.includes(email)) {
      list.push(email);
      await env.TESLA_KV.put(SUBSCRIBERS_KEY, JSON.stringify(list));
    }
  } else {
    throw new Error('No subscriber storage configured');
  }
}
