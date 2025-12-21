import { Context, Next } from 'hono';
import { extractError, logger } from '../utils/log';

export async function errorHandler(c: Context, next: Next) {
  try {
    await next();
  } catch (err) {
    const extracted = extractError(err);
    logger.error('request.unhandled_error', { path: c.req.path, error: extracted.message });
    
    const status = (err as any)?.status || 500;
    const message = (err as any)?.message || 'Internal server error';
    
    return c.json({
      error: message,
      timestamp: new Date().toISOString(),
      path: c.req.path
    }, status);
  }
}