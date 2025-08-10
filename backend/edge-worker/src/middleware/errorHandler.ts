import { Context, Next } from 'hono';

export async function errorHandler(c: Context, next: Next) {
  try {
    await next();
  } catch (err) {
    console.error('Request error:', err);
    
    const status = (err as any)?.status || 500;
    const message = (err as any)?.message || 'Internal server error';
    
    return c.json({
      error: message,
      timestamp: new Date().toISOString(),
      path: c.req.path
    }, status);
  }
}