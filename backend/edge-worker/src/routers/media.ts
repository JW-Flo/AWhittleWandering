import { Hono } from 'hono';
import { z } from 'zod';
import type { Env } from '../types/env';
import { logger } from '../utils/log';

export const mediaRouter = new Hono<{ Bindings: Env }>();

const ALLOWED_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/heic',
  'video/mp4', 'video/quicktime',
  'audio/mpeg', 'audio/mp4', 'audio/webm',
]);

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

const metadataSchema = z.object({
  journeyId: z.string().min(1),
  caption: z.string().max(500).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  takenAt: z.string().optional(),
});

// Upload media to R2
mediaRouter.post('/upload', async (c) => {
  const bucket = c.env?.MEDIA_BUCKET;
  if (!bucket) return c.json({ ok: false, error: 'Media storage not configured' }, 503);

  try {
    const contentType = c.req.header('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await c.req.formData();
      const file = formData.get('file');
      if (!(file instanceof File)) {
        return c.json({ ok: false, error: 'Missing file in form data' }, 400);
      }

      const mimeType = file.type;
      if (!ALLOWED_TYPES.has(mimeType)) {
        return c.json({ ok: false, error: `Unsupported file type: ${mimeType}` }, 400);
      }
      if (file.size > MAX_FILE_SIZE) {
        return c.json({ ok: false, error: `File too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)` }, 400);
      }

      const journeyId = formData.get('journeyId')?.toString() || '';
      const caption = formData.get('caption')?.toString() || '';
      const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'bin';
      const key = `${journeyId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

      await bucket.put(key, file.stream(), {
        httpMetadata: { contentType: mimeType },
        customMetadata: {
          journeyId,
          caption,
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      });

      return c.json({
        ok: true,
        key,
        size: file.size,
        contentType: mimeType,
        url: `/api/v1/media/${key}`,
      }, 201);
    }

    return c.json({ ok: false, error: 'Expected multipart/form-data' }, 400);
  } catch (err: any) {
    logger.error('media.upload.error', { error: err?.message });
    return c.json({ ok: false, error: 'Upload failed' }, 500);
  }
});

// Get media file from R2
mediaRouter.get('/:key{.+}', async (c) => {
  const bucket = c.env?.MEDIA_BUCKET;
  if (!bucket) return c.json({ ok: false, error: 'Media storage not configured' }, 503);

  const key = c.req.param('key');

  try {
    const object = await bucket.get(key);
    if (!object) return c.json({ ok: false, error: 'Not found' }, 404);

    const headers = new Headers();
    headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('ETag', object.httpEtag);

    return new Response(object.body, { headers });
  } catch (err: any) {
    logger.error('media.get.error', { error: err?.message, key });
    return c.json({ ok: false, error: 'Failed to retrieve media' }, 500);
  }
});

// List media for a journey
mediaRouter.get('/', async (c) => {
  const bucket = c.env?.MEDIA_BUCKET;
  if (!bucket) return c.json({ ok: false, error: 'Media storage not configured' }, 503);

  const journeyId = c.req.query('journeyId');
  if (!journeyId) return c.json({ ok: false, error: 'journeyId required' }, 400);

  try {
    const listed = await bucket.list({ prefix: `${journeyId}/`, limit: 100 });
    const items = listed.objects.map(obj => ({
      key: obj.key,
      size: obj.size,
      uploaded: obj.uploaded.toISOString(),
      url: `/api/v1/media/${obj.key}`,
    }));

    return c.json({ ok: true, items, truncated: listed.truncated });
  } catch (err: any) {
    logger.error('media.list.error', { error: err?.message });
    return c.json({ ok: false, error: 'Failed to list media' }, 500);
  }
});
