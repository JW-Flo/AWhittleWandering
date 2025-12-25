import { Hono } from 'hono';
import { z } from 'zod';
import { requireUser } from '../middleware/userAuth';

export const notificationsRouter = new Hono();

const listSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(25),
  cursor: z.string().optional(), // created_at ISO cursor (best-effort)
  unreadOnly: z.coerce.boolean().optional(),
});

notificationsRouter.get('/', requireUser, async (c) => {
  const db = c.env?.TESLA_DB;
  if (!db) return c.json({ ok: false, error: 'Database not configured' }, 500);
  const user = c.get('user');

  const parsed = listSchema.safeParse({
    limit: c.req.query('limit'),
    cursor: c.req.query('cursor'),
    unreadOnly: c.req.query('unreadOnly'),
  });
  if (!parsed.success) return c.json({ ok: false, error: 'Validation failed', issues: parsed.error.issues }, 400);
  const { limit, cursor, unreadOnly } = parsed.data;

  const where: string[] = ['user_id = ?'];
  const bind: any[] = [user.id];
  if (unreadOnly) where.push('read_at IS NULL');
  if (cursor) {
    where.push('created_at < ?');
    bind.push(cursor);
  }

  const rows = await db
    .prepare(
      `SELECT id, journey_id, notification_type, title, body, metadata_json, created_at, read_at
       FROM notifications
       WHERE ${where.join(' AND ')}
       ORDER BY created_at DESC
       LIMIT ?`
    )
    .bind(...bind, limit)
    .all<any>();

  const results = rows.results || [];
  const nextCursor = results.length ? results[results.length - 1].created_at : null;
  return c.json({ ok: true, notifications: results, nextCursor });
});

const markReadSchema = z.object({
  read: z.boolean().default(true),
});

notificationsRouter.post('/:id/read', requireUser, async (c) => {
  const db = c.env?.TESLA_DB;
  if (!db) return c.json({ ok: false, error: 'Database not configured' }, 500);
  const user = c.get('user');
  const id = c.req.param('id');

  let body: z.infer<typeof markReadSchema>;
  try {
    body = markReadSchema.parse(await c.req.json().catch(() => ({})));
  } catch (e: any) {
    return c.json({ ok: false, error: 'Validation failed', issues: e?.issues }, 400);
  }

  if (body.read) {
    await db
      .prepare(`UPDATE notifications SET read_at = datetime('now') WHERE id = ? AND user_id = ?`)
      .bind(id, user.id)
      .run();
  } else {
    await db.prepare(`UPDATE notifications SET read_at = NULL WHERE id = ? AND user_id = ?`).bind(id, user.id).run();
  }

  return c.json({ ok: true });
});


