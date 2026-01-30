import { Hono } from 'hono';
import { z } from 'zod';
import { logger } from '../utils/log';
import { withTimeout } from '../utils/cronMetrics';
import type { Env } from '../types/env';

export const aiRouter = new Hono<{ Bindings: Env }>();

const optimizeSchema = z.object({
  start: z.object({ lat: z.number(), lng: z.number() }),
  end: z.object({ lat: z.number(), lng: z.number() }),
  waypoints: z.array(z.object({ lat: z.number(), lng: z.number() })).optional(),
  constraints: z.record(z.any()).optional()
});

const journalSchema = z.object({
  date: z.string().optional(),
  highlights: z.array(z.string()).optional(),
  context: z.record(z.any()).optional()
});

function aiUnavailable(c: any) {
  return c.json({
    ok: false,
    error: 'AI not configured',
    hint: 'Bind Cloudflare AI (env.AI) and set AI_MODEL_NAME / AI gateway if used.',
    timestamp: new Date().toISOString()
  }, 503);
}

aiRouter.post('/route/optimize', async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ ok: false, error: 'Malformed JSON body' }, 400);
  }
  const parsed = optimizeSchema.safeParse(body);
  if (!parsed.success) return c.json({ ok: false, error: 'Validation failed', issues: parsed.error.issues }, 400);

  if (!c.env?.AI || typeof c.env.AI.run !== 'function') return aiUnavailable(c);

  try {
    const prompt = `Optimize an EV road trip route.
Start: ${parsed.data.start.lat},${parsed.data.start.lng}
End: ${parsed.data.end.lat},${parsed.data.end.lng}
Waypoints: ${JSON.stringify(parsed.data.waypoints || [])}
Constraints: ${JSON.stringify(parsed.data.constraints || {})}

Return JSON only with keys: summary, suggestedStops (array), notes.`;

    const model = c.env?.AI_MODEL_NAME || '@cf/meta/llama-3.1-8b-instruct';
    const result = await withTimeout(
      c.env.AI.run(model, { prompt }),
      12000,
      'ai.route.optimize'
    );

    return c.json({ ok: true, model, result, timestamp: new Date().toISOString() });
  } catch (err: any) {
    logger.error('ai.route.optimize.error', { error: err?.message });
    return c.json({ ok: false, error: 'AI request failed', timestamp: new Date().toISOString() }, 502);
  }
});

aiRouter.post('/journal/generate', async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ ok: false, error: 'Malformed JSON body' }, 400);
  }
  const parsed = journalSchema.safeParse(body);
  if (!parsed.success) return c.json({ ok: false, error: 'Validation failed', issues: parsed.error.issues }, 400);

  if (!c.env?.AI || typeof c.env.AI.run !== 'function') return aiUnavailable(c);

  try {
    const model = c.env?.AI_MODEL_NAME || '@cf/meta/llama-3.1-8b-instruct';
    const prompt = `Write a concise travel journal entry for a Tesla road trip day.
Date: ${parsed.data.date || new Date().toISOString().slice(0, 10)}
Highlights: ${JSON.stringify(parsed.data.highlights || [])}
Context JSON: ${JSON.stringify(parsed.data.context || {})}

Return JSON only with keys: title, entry, bulletHighlights.`;

    const result = await withTimeout(
      c.env.AI.run(model, { prompt }),
      12000,
      'ai.journal.generate'
    );
    return c.json({ ok: true, model, result, timestamp: new Date().toISOString() });
  } catch (err: any) {
    logger.error('ai.journal.generate.error', { error: err?.message });
    return c.json({ ok: false, error: 'AI request failed', timestamp: new Date().toISOString() }, 502);
  }
});

