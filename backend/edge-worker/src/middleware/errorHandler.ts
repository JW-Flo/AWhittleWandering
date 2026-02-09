import { Context, Next } from 'hono';
import { extractError, logger } from '../utils/log';

export async function errorHandler(c: Context, next: Next) {
  try {
    await next();
  } catch (err) {
    const requestId: string = c.get('requestId') || crypto.randomUUID();
    const extracted = extractError(err);
    logger.error('request.unhandled_error', { requestId, path: c.req.path, error: extracted.message });

    const status = (err as any)?.status || 500;
    const message = (err as any)?.message || 'Internal server error';

    c.header('X-Request-ID', requestId);
    return c.json({
      error: message,
      requestId,
      timestamp: new Date().toISOString(),
      path: c.req.path
    }, status);
  }
}