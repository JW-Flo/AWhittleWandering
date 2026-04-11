import { Hono } from 'hono';
import { z } from 'zod';
import { requireUser } from '../middleware/userAuth';
import type { AppContext } from '../types/env';

export const journalRouter = new Hono<AppContext>();

const entrySchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
  location: z.string().max(200).optional(),
  mood: z.enum(['excited', 'happy', 'satisfied', 'neutral', 'concerned', 'frustrated']).optional(),
  entry_type: z.string().max(50).optional(),
});

/** GET /api/v1/journal/:journeyId — public */
journalRouter.get('/:journeyId', async (c) => {
  const db = c.env?.TESLA_DB;
  if (!db) return c.json({ ok: false, error: 'DB not configured' }, 500);
  const journeyId = c.req.param('journeyId');
  const rows = await db
    .prepare(
      `SELECT id, journey_id, title, content, location, mood, entry_type, auto_generated, created_at, updated_at
       FROM journal_entries
       WHERE journey_id = ? AND is_public = 1
       ORDER BY created_at DESC
       LIMIT 100`
    )
    .bind(journeyId)
    .all<Record<string, unknown>>();
  return c.json({ ok: true, entries: rows.results ?? [] });
});

/** POST /api/v1/journal/:journeyId — auth required */
journalRouter.post('/:journeyId', requireUser, async (c) => {
  const db = c.env?.TESLA_DB;
  if (!db) return c.json({ ok: false, error: 'DB not configured' }, 500);
  const journeyId = c.req.param('journeyId');
  const body = await c.req.json().catch(() => ({}));
  const parsed = entrySchema.safeParse(body);
  if (!parsed.success) return c.json({ ok: false, error: 'Validation failed', issues: parsed.error.issues }, 400);

  const user = c.get('user');
  const { title, content, location, mood = 'neutral', entry_type = 'manual' } = parsed.data;
  const now = new Date().toISOString();

  const result = await db
    .prepare(
      `INSERT INTO journal_entries (journey_id, title, content, location, mood, entry_type, author_id, is_public, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
    )
    .bind(journeyId, title, content, location ?? null, mood, entry_type, user.id, now, now)
    .run();

  return c.json({ ok: true, id: result.meta?.last_row_id }, 201);
});

/** PUT /api/v1/journal/:journeyId/:id — auth required */
journalRouter.put('/:journeyId/:id', requireUser, async (c) => {
  const db = c.env?.TESLA_DB;
  if (!db) return c.json({ ok: false, error: 'DB not configured' }, 500);
  const journeyId = c.req.param('journeyId');
  const id = Number(c.req.param('id'));
  const body = await c.req.json().catch(() => ({}));
  const parsed = entrySchema.partial().safeParse(body);
  if (!parsed.success) return c.json({ ok: false, error: 'Validation failed' }, 400);

  const fields = parsed.data;
  const now = new Date().toISOString();
  const sets: string[] = ['updated_at = ?'];
  const binds: unknown[] = [now];

  if (fields.title !== undefined) { sets.push('title = ?'); binds.push(fields.title); }
  if (fields.content !== undefined) { sets.push('content = ?'); binds.push(fields.content); }
  if (fields.location !== undefined) { sets.push('location = ?'); binds.push(fields.location); }
  if (fields.mood !== undefined) { sets.push('mood = ?'); binds.push(fields.mood); }
  if (fields.entry_type !== undefined) { sets.push('entry_type = ?'); binds.push(fields.entry_type); }

  binds.push(id, journeyId);
  await db
    .prepare(`UPDATE journal_entries SET ${sets.join(', ')} WHERE id = ? AND journey_id = ?`)
    .bind(...binds)
    .run();

  return c.json({ ok: true });
});

/** DELETE /api/v1/journal/:journeyId/:id — auth required */
journalRouter.delete('/:journeyId/:id', requireUser, async (c) => {
  const db = c.env?.TESLA_DB;
  if (!db) return c.json({ ok: false, error: 'DB not configured' }, 500);
  const journeyId = c.req.param('journeyId');
  const id = Number(c.req.param('id'));
  await db
    .prepare(`DELETE FROM journal_entries WHERE id = ? AND journey_id = ?`)
    .bind(id, journeyId)
    .run();
  return c.json({ ok: true });
});
