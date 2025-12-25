import { Hono } from 'hono';
import { z } from 'zod';
import { requireUser } from '../middleware/userAuth';
import { sha256B64Url } from '../utils/sha256';

export const pushRouter = new Hono();

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(10),
    auth: z.string().min(6),
  }),
});

pushRouter.post('/subscribe', requireUser, async (c) => {
  const db = c.env?.TESLA_DB;
  if (!db) return c.json({ ok: false, error: 'Database not configured' }, 500);
  const user = c.get('user');

  let body: z.infer<typeof subscribeSchema>;
  try {
    body = subscribeSchema.parse(await c.req.json());
  } catch (e: any) {
    return c.json({ ok: false, error: 'Validation failed', issues: e?.issues }, 400);
  }

  const ua = c.req.header('User-Agent') || '';
  const uaHash = ua ? await sha256B64Url(ua) : null;

  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth, ua_hash, created_at, last_seen_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
       ON CONFLICT(user_id, endpoint) DO UPDATE SET
         p256dh=excluded.p256dh,
         auth=excluded.auth,
         ua_hash=excluded.ua_hash,
         last_seen_at=datetime('now'),
         revoked_at=NULL`
    )
    .bind(id, user.id, body.endpoint, body.keys.p256dh, body.keys.auth, uaHash)
    .run();

  return c.json({ ok: true });
});

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

pushRouter.post('/unsubscribe', requireUser, async (c) => {
  const db = c.env?.TESLA_DB;
  if (!db) return c.json({ ok: false, error: 'Database not configured' }, 500);
  const user = c.get('user');

  let body: z.infer<typeof unsubscribeSchema>;
  try {
    body = unsubscribeSchema.parse(await c.req.json());
  } catch (e: any) {
    return c.json({ ok: false, error: 'Validation failed', issues: e?.issues }, 400);
  }

  await db
    .prepare(`UPDATE push_subscriptions SET revoked_at = datetime('now') WHERE user_id = ? AND endpoint = ?`)
    .bind(user.id, body.endpoint)
    .run();
  return c.json({ ok: true });
});


