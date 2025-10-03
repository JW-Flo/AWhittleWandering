// Utilities for persisting cron job metrics and providing a timeout wrapper.
// Prefers D1 (TESLA_DB). Falls back to KV (AUTH_TOKENS) storing only last run metadata per job.

export interface CronRunMeta {
  job: string;
  cron: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  success: boolean;
  error?: string;
}

interface D1Database { prepare(query: string): D1PreparedStatement; }
interface D1PreparedStatement { bind(...values: any[]): D1PreparedStatement; run(): Promise<any>; }

async function ensureTable(db: D1Database) {
  try {
    await db.prepare(`CREATE TABLE IF NOT EXISTS cron_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job TEXT NOT NULL,
      cron TEXT NOT NULL,
      started_at TEXT NOT NULL,
      finished_at TEXT NOT NULL,
      duration_ms INTEGER NOT NULL,
      success INTEGER NOT NULL,
      error TEXT
    )`).run();
  } catch { /* ignore */ }
}

export async function persistCronRun(env: any, meta: CronRunMeta) {
  const db: D1Database | undefined = env?.TESLA_DB;
  if (db) {
    await ensureTable(db);
    try {
      await db.prepare(`INSERT INTO cron_metrics (job, cron, started_at, finished_at, duration_ms, success, error)
        VALUES (?, ?, ?, ?, ?, ?, ?)`)
        .bind(meta.job, meta.cron, meta.startedAt, meta.finishedAt, meta.durationMs, meta.success ? 1 : 0, meta.error || null)
        .run();
      return;
    } catch { /* fall through */ }
  }
  const kv = env?.AUTH_TOKENS;
  if (kv?.put) {
    try { await kv.put(`cron:last:${meta.job}`, JSON.stringify(meta), { expirationTtl: 604800 }); } catch { /* ignore */ }
  }
}

export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let to: any;
  const timeout = new Promise<never>((_, reject) => { to = setTimeout(() => reject(new Error(`Timeout after ${ms}ms in ${label}`)), ms); });
  return Promise.race([promise.finally(() => clearTimeout(to)), timeout]);
}

export async function recordRun(env: any, cron: string, job: string, fn: () => Promise<void>, timeoutMs = 25000) {
  const started = Date.now();
  try {
    await withTimeout(fn(), timeoutMs, job);
    await persistCronRun(env, { job, cron, startedAt: new Date(started).toISOString(), finishedAt: new Date().toISOString(), durationMs: Date.now() - started, success: true });
    console.log(JSON.stringify({ level: 'info', event: 'cron.job.ok', job, cron, ms: Date.now() - started }));
  } catch (err: any) {
    await persistCronRun(env, { job, cron, startedAt: new Date(started).toISOString(), finishedAt: new Date().toISOString(), durationMs: Date.now() - started, success: false, error: err?.message || String(err) });
    console.log(JSON.stringify({ level: 'error', event: 'cron.job.fail', job, cron, error: err?.message }));
  }
}
