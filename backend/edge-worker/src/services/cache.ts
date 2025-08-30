import { Context } from 'hono';

// Simple in-memory cache for development/testing
class SimpleCache {
  private cache = new Map<string, { data: any; expires: number }>();

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  set(key: string, data: any, ttlSeconds: number = 30): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + (ttlSeconds * 1000)
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

export const cache = new SimpleCache();

export class CacheService {
  static async get(c: Context, key: string): Promise<any | null> {
    // Try in-memory cache first
    const cached = cache.get(key);
    if (cached) return cached;

    // Try D1 cache if available
    if (c.env?.TESLA_DB) {
      try {
        const result = await c.env.TESLA_DB.prepare(`
          SELECT cache_data FROM api_cache
          WHERE cache_key = ? AND expires_at > datetime('now')
        `).bind(key).first();
        
        if (result?.cache_data) {
          const data = JSON.parse(result.cache_data as string);
          // Also store in memory cache
          cache.set(key, data, 15);
          return data;
        }
      } catch (e) {
        console.warn('D1 cache read failed:', e);
      }
    }

    return null;
  }

  static async set(c: Context, key: string, data: any, ttlSeconds: number = 30): Promise<void> {
    // Store in memory cache
    cache.set(key, data, ttlSeconds);

    // Try to store in D1 cache if available
    if (c.env?.TESLA_DB) {
      try {
        const expiresAt = new Date(Date.now() + (ttlSeconds * 1000)).toISOString();
        await c.env.TESLA_DB.prepare(`
          INSERT OR REPLACE INTO api_cache (cache_key, cache_data, cache_type, expires_at)
          VALUES (?, ?, 'json', ?)
        `).bind(key, JSON.stringify(data), expiresAt).run();
      } catch (e) {
        console.warn('D1 cache write failed:', e);
      }
    }
  }

  static async delete(c: Context, key: string): Promise<void> {
    cache.delete(key);
    
    if (c.env?.TESLA_DB) {
      try {
        await c.env.TESLA_DB.prepare(`DELETE FROM api_cache WHERE cache_key = ?`).bind(key).run();
      } catch (e) {
        console.warn('D1 cache delete failed:', e);
      }
    }
  }
}