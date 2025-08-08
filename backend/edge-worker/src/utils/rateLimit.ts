export interface RateLimitConfig { key: string; minIntervalMs: number; burst?: number }

export async function canProceed(db: any, cfg: RateLimitConfig): Promise<{ allowed: boolean; waitMs: number }>{
  try {
    const row = await db.prepare(`SELECT last_call_ms FROM api_rate_limits WHERE key = ?`).bind(cfg.key).first();
    const now = Date.now(); const last = row?.last_call_ms || 0; const elapsed = now - last;
    if (elapsed >= cfg.minIntervalMs) return { allowed: true, waitMs: 0 };
    return { allowed: false, waitMs: cfg.minIntervalMs - elapsed };
  } catch { return { allowed: true, waitMs: 0 }; }
}

export async function recordCall(db: any, key: string) {
  try {
    await db.prepare(`INSERT INTO api_rate_limits (key, last_call_ms) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET last_call_ms = excluded.last_call_ms`).bind(key, Date.now()).run();
  } catch { /* noop */ }
}
