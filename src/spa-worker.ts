/**
 * SPA Fallback Worker for Cloudflare Workers Static Assets
 *
 * Replaces the _redirects file to avoid Cloudflare validation error 10021
 * (infinite redirect loop). Instead, SPA routing is handled in code:
 *
 *  1. /api/* requests pass through (404 if no backend match).
 *  2. Static asset requests (js, css, images, etc.) are served directly.
 *  3. HTML navigation requests that 404 are rewritten to /index.html
 *     so the React SPA router can handle them client-side.
 */

interface Env {
  ASSETS: Fetcher;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Never rewrite API routes — let them 404 naturally if unmatched.
    if (url.pathname.startsWith('/api')) {
      return new Response('Not Found', { status: 404 });
    }

    // Attempt to serve the requested static asset.
    const assetResponse = await env.ASSETS.fetch(request);

    // Asset found — return it as-is (includes index.html for /).
    if (assetResponse.status !== 404) {
      return assetResponse;
    }

    // SPA fallback: only for GET requests that accept HTML.
    const accept = request.headers.get('Accept') || '';
    if (request.method === 'GET' && accept.includes('text/html')) {
      const indexUrl = new URL('/index.html', request.url);
      return env.ASSETS.fetch(new Request(indexUrl.toString()));
    }

    // Non-HTML 404 (e.g. missing .js/.css file) — return the original 404.
    return assetResponse;
  },
} satisfies ExportedHandler<Env>;
