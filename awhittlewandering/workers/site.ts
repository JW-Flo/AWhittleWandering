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
// import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
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
/**
 * Returns the HTML content for the staging environment.
 */
function getStagingHtmlContent(): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>A Whittle Wandering - Staging</title>
      <meta name="description" content="Follow our 60-day journey across all 48 continental US states in a Tesla.">
      <style>
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .container { max-width: 800px; margin: 0 auto; padding: 40px 20px; text-align: center; }
        .badge { display: inline-block; background: #ff6b35; color: white; padding: 4px 12px; border-radius: 16px; font-size: 14px; margin-bottom: 20px; }
        h1 { color: #2c3e50; margin-bottom: 10px; }
        .subtitle { color: #7f8c8d; font-size: 18px; margin-bottom: 40px; }
        .status { background: #ecf0f1; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .feature { background: white; border: 1px solid #ddd; padding: 20px; margin: 10px 0; border-radius: 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="badge">STAGING</div>
        <h1>A Whittle Wandering</h1>
        <p class="subtitle">48 States, One Tesla, One Epic Journey</p>
        
        <div class="status">
          <h3>🚀 Staging Environment Active</h3>
          <p>This is the staging version of our site. The full application with interactive maps and real-time Tesla tracking will be available once frontend assets are properly deployed.</p>
        </div>
        
        <div class="feature">
          <h4>🗺️ Interactive Route Map</h4>
          <p>Follow our real-time location as we travel across the continental United States</p>
        </div>
        
        <div class="feature">
          <h4>⚡ Tesla Analytics</h4>
          <p>Track battery levels, charging stops, and travel statistics</p>
        </div>
        
        <div class="feature">
          <h4>📱 Live Updates</h4>
          <p>Get real-time updates on our journey progress and daily highlights</p>
        </div>
        
        <p style="margin-top: 40px; color: #95a5a6; font-size: 14px;">
          Powered by Cloudflare Workers • Built with React & TypeScript
        </p>
      </div>
    </body>
    </html>
  `;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
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
      
      // For staging, serve a simple HTML page
      // For staging, serve a simple HTML page
      return addSecurityHeaders(createHTMLResponse(getStagingHtmlContent()));
      console.error('Site worker error:', error);
      return createHTMLResponse('Internal Server Error', 500);
    }
  }
};
