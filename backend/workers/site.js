/**
 * Site Worker - Handles static file serving and client-side navigation
 *
 * Responsibilities:
 * - Serves the frontend application
 * - Handles asset requests
 * - Integrates with API, Browser, and Dispatch workers
 * - Implements streaming for improved performance
 */
import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
// Cloudflare Pages default caching values
const DEFAULT_CACHE_CONTROL = {
    browserTTL: 0, // No browser cache by default
    edgeTTL: 2 * 60 * 60 * 24, // 2 days
    bypassCache: false, // Don't bypass Cloudflare's cache
};
// Content types for common file extensions
const CONTENT_TYPES = {
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
function getContentType(filename) {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    return CONTENT_TYPES[ext] || 'text/plain';
}
/**
 * Create an HTML response with the correct headers
 */
function createHTMLResponse(html, status = 200) {
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
function createJSONResponse(data, status = 200) {
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
function addSecurityHeaders(response) {
    const headers = new Headers(response.headers);
    // Add security headers
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('X-Frame-Options', 'DENY');
    headers.set('X-XSS-Protection', '1; mode=block');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    // Add strict CSP for HTML responses
    if (headers.get('Content-Type')?.includes('text/html')) {
        headers.set('Content-Security-Policy', "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline' https://api.mapbox.com; " +
            "style-src 'self' 'unsafe-inline' https://api.mapbox.com; " +
            "img-src 'self' data: blob: https://*.mapbox.com; " +
            "connect-src 'self' https://*.mapbox.com https://api.awhittlewandering.com; " +
            "font-src 'self'; " +
            "object-src 'none'; " +
            "frame-ancestors 'none';");
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
    async fetch(request, env, ctx) {
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
            // Handle static assets served from KV/R2
            try {
                // First try to get from __STATIC_CONTENT (KV for assets) if configured
                if (env.__STATIC_CONTENT) {
                    const response = await getAssetFromKV({
                        request,
                        waitUntil: ctx.waitUntil.bind(ctx),
                        cacheControl: DEFAULT_CACHE_CONTROL
                    });
                    return addSecurityHeaders(response);
                }
                // Fallback to R2 bucket if available
                if (env.STATIC_ASSETS) {
                    // Extract the path without leading slash
                    const path = pathname.replace(/^\//, '');
                    // Fetch from R2 bucket
                    const object = await env.STATIC_ASSETS.get(path || 'index.html');
                    if (object) {
                        // Determine content type
                        const contentType = getContentType(path);
                        const headers = new Headers();
                        headers.set('Content-Type', contentType);
                        headers.set('Cache-Control', 'public, max-age=14400'); // 4 hours
                        return addSecurityHeaders(new Response(object.body, { headers }));
                    }
                }
            }
            catch (error) {
                console.error('Asset retrieval error:', error);
                // Continue to serve the SPA as fallback
            }
            // For all other routes, serve the SPA - client-side routing will take over
            // Get the index.html file from KV or create a basic response
            let htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>A Whittle Wandering</title>
          <meta name="description" content="Follow our 60-day journey across all 48 continental US states in a Tesla.">
          <link rel="stylesheet" href="/styles.css">
          <script defer src="/main.js"></script>
        </head>
        <body>
          <div id="root">
            <p>Loading A Whittle Wandering...</p>
          </div>
        </body>
        </html>
      `;
            // Try to get the real index.html if it exists in KV
            try {
                if (env.__STATIC_CONTENT) {
                    // Create a new request for index.html
                    const indexRequest = new Request(new URL('/index.html', request.url).toString(), request);
                    const response = await getAssetFromKV({
                        request: indexRequest,
                        waitUntil: ctx.waitUntil.bind(ctx),
                        cacheControl: DEFAULT_CACHE_CONTROL
                    });
                    htmlContent = await response.text();
                }
                else if (env.STATIC_ASSETS) {
                    // Try to get index.html from R2
                    const indexObject = await env.STATIC_ASSETS.get('index.html');
                    if (indexObject) {
                        htmlContent = await indexObject.text();
                    }
                }
            }
            catch (error) {
                console.error('Failed to retrieve index.html:', error);
                // Continue with the basic HTML
            }
            // Return the HTML with security headers
            return addSecurityHeaders(createHTMLResponse(htmlContent));
        }
        catch (error) {
            console.error('Site worker error:', error);
            return createHTMLResponse('Internal Server Error', 500);
        }
    }
};
