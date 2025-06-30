/**
 * Site Worker - Handles static file serving and client-side navigation
 * 
 * Responsibilities:
 * - Serves the frontend application
 * - Handles asset requests
 * - Integrates with API, Browser, and Dispatch workers
 * - Implements streaming for improved performance
 */

import { Env, ExecutionContext } from '../packages/shared/types';
import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
import assetManifest from '__STATIC_CONTENT_MANIFEST' assert { type: 'json' };
// Cloudflare Pages default caching values
const DEFAULT_CACHE_CONTROL = {
  browserTTL: 0, // No browser cache by default
  edgeTTL: 2 * 60 * 60 * 24, // 2 days
  bypassCache: false, // Don't bypass Cloudflare's cache
};

// Content types for common file extensions
const CONTENT_TYPES: Record<string, string> = {
  'js': 'application/javascript',
  'css': 'text/css',
  'html': 'text/html',
  'json': 'application/json',
  'png': 'image/png',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'svg': 'image/svg+xml',
  'ico': 'image/x-icon',
  'webp': 'image/webp',
  'woff': 'font/woff',
  'woff2': 'font/woff2',
  'ttf': 'font/ttf',
  'otf': 'font/otf',
  'eot': 'application/vnd.ms-fontobject',
};

/**
 * Get content type based on file extension
 */
function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return CONTENT_TYPES[ext] || 'text/plain';
}

/**
 * Create an HTML response with the correct headers
 */
function createHTMLResponse(html: string, status = 200): Response {
  return new Response(html, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

/**
 * Create JSON response with the correct headers
 */
function createJSONResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

/**
 * Enhance response with security headers
 */
function addSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  
  // Add security headers
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Add strict CSP for HTML responses
  if (headers.get('Content-Type')?.includes('text/html')) {
    headers.set('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' https://api.mapbox.com; " +
      "style-src 'self' 'unsafe-inline' https://api.mapbox.com; " +
      "img-src 'self' data: blob: https://*.mapbox.com; " +
      "connect-src 'self' https://*.mapbox.com https://api.awhittlewandering.com; " +
      "font-src 'self'; " +
      "object-src 'none'; " +
      "frame-ancestors 'none';"
    );
  }
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * The main handler for all site requests
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;
    
    try {
      // Handle API requests - forward to API worker
      if (pathname.startsWith('/api/')) {
        if (env.aww_api) {
          return env.aww_api.fetch(request, env);
        }
        return createJSONResponse({ error: 'API service unavailable' }, 503);
      }
      
      // Handle render requests - forward to Browser worker
      if (pathname.startsWith('/render/')) {
        if (env.aww_browser) {
          return env.aww_browser.fetch(request, env);
        }
        return createJSONResponse({ error: 'Render service unavailable' }, 503);
      }
      
      // Handle dispatch requests - forward to Dispatch worker
      if (pathname.startsWith('/dispatch/')) {
        if (env.aww_dispatch) {
          return env.aww_dispatch.fetch(request, env);
        }
        return createJSONResponse({ error: 'Dispatch service unavailable' }, 503);
      }
      
      // Try to serve static assets from Workers Sites KV
      try {
        const response = await getAssetFromKV({
          request,
          waitUntil: ctx.waitUntil.bind(ctx),
        }, {
          cacheControl: DEFAULT_CACHE_CONTROL,
          ASSET_NAMESPACE: (env as any).__STATIC_CONTENT,
          ASSET_MANIFEST: assetManifest,
          mapRequestToAsset: (req) => {
            // For client-side routing, always serve index.html for non-asset requests
            const url = new URL(req.url);
            
            // If it's a static asset, serve it directly
            if (url.pathname.startsWith('/assets/') || 
                url.pathname.endsWith('.js') ||
                url.pathname.endsWith('.css') ||
                url.pathname.endsWith('.ico') ||
                url.pathname.endsWith('.png') ||
                url.pathname.endsWith('.jpg') ||
                url.pathname.endsWith('.svg')) {
              return req;
            }
            
            // For all other routes (SPA routing), serve index.html
            return new Request(`${url.origin}/index.html`, req);
          }
        });
        
        return addSecurityHeaders(response);
      } catch (error) {
        console.error('KV asset retrieval error:', error, 'for path:', pathname);
        
        // If it's an asset request that failed, return 404
        if (pathname.startsWith('/assets/') || 
            pathname.endsWith('.js') || 
            pathname.endsWith('.css') ||
            pathname.includes('.')) {
          return new Response(`Asset not found: ${pathname}`, { status: 404 });
        }
        
        // For page routes, serve a fallback HTML
        const htmlContent = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>A Whittle Wandering</title>
            <meta name="description" content="Follow our 60-day journey across all 48 continental US states in a Tesla.">
            <link rel="preconnect" href="https://api.mapbox.com" />
            <link href='https://api.mapbox.com/mapbox-gl-js/v3.1.0/mapbox-gl.css' rel='stylesheet' />
          </head>
          <body>
            <div id="root">
              <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
                <h1>A Whittle Wandering</h1>
                <p>60 Days, 48 States, One Tesla, One Epic Journey</p>
                <p>Assets are being loaded...</p>
                <div style="margin-top: 20px; padding: 10px; background: #f0f0f0; border-radius: 5px;">
                  <small>Error loading assets. Displaying fallback page.</small>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;
        
        return addSecurityHeaders(createHTMLResponse(htmlContent));
      }
    } catch (error) {
      console.error('Site worker error:', error);
      return createHTMLResponse('Internal Server Error', 500);
    }
  }
};
