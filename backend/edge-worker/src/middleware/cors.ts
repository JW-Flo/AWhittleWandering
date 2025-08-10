import { cors } from 'hono/cors';
import { Context, Next } from 'hono';

export const corsMiddleware = cors({
  origin: [
    'https://awhittlewandering.com',
    'https://*.awhittlewandering.com',
    'https://*.awhittlewandering-frontend.pages.dev',
    'http://localhost:8080',
    'http://localhost:3000'
  ],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Client-ID', 'X-Admin-Token'],
  credentials: true
});

export async function securityHeaders(c: Context, next: Next) {
  await next();
  
  // Add security headers
  c.res.headers.set('X-Content-Type-Options', 'nosniff');
  c.res.headers.set('X-Frame-Options', 'DENY');
  c.res.headers.set('X-XSS-Protection', '1; mode=block');
  c.res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.res.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Add Content Security Policy for API responses
  if (c.req.path.startsWith('/api/')) {
    c.res.headers.set('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  }
}