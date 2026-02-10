import { cors } from 'hono/cors';
import { Context, Next } from 'hono';

function isAllowedOrigin(origin: string): boolean {
  // Local dev (8081 = Vite frontend, 8787 = Wrangler backend, others = common dev ports)
  if (origin === 'http://localhost:8080') return true;
  if (origin === 'http://localhost:8081') return true;
  if (origin === 'http://localhost:3000') return true;
  if (origin === 'http://localhost:5173') return true;

  // Canonical production domains
  if (origin === 'https://awhittlewandering.com') return true;
  if (origin === 'https://www.awhittlewandering.com') return true;

  // Cloudflare Pages preview/prod domains
  if (origin === 'https://awhittlewandering.pages.dev') return true;
  if (origin === 'https://awhittlewandering-frontend.pages.dev') return true;
  if (origin === 'https://awhittlewandering-site.pages.dev') return true;
  if (/^https:\/\/[a-z0-9-]+\.awhittlewandering-frontend\.pages\.dev$/i.test(origin)) return true;
  if (/^https:\/\/[a-z0-9-]+\.awhittlewandering-site\.pages\.dev$/i.test(origin)) return true;
  if (/^https:\/\/([a-z0-9-]+\.)?awhittlewandering\.pages\.dev$/i.test(origin)) return true;

  return false;
}

export const corsMiddleware = cors({
  origin: (origin) => {
    // If the request has no Origin header (server-to-server / curl), do not emit CORS headers.
    // This avoids an invalid combination when `credentials: true` (ACAO="*" is forbidden with credentials).
    if (!origin) return null;
    return isAllowedOrigin(origin) ? origin : null;
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Client-ID'],
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