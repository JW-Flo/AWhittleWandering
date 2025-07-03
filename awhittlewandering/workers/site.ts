/**
 * Main Worker for A Whittle Wandering
 * 
 * Routes requests to appropriate handlers:
 * - Static site serving
 * - Live telemetry API
 * - Mapbox proxy
 * - Weather data
 * - Existing trip API
 */

import { Env, ExecutionContext } from '../packages/shared/types';
import { TelemetryCacheDO } from './TelemetryCacheDO';
import { handleMapboxProxy } from './mapboxProxy';
import { handleWeatherRequest, preWarmWeatherCache } from './weatherCache';
import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

export { TelemetryCacheDO };

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    try {
      // API routes
      if (url.pathname.startsWith('/api/')) {
        return await handleApiRequest(request, env, ctx);
      }
      
      // Health check
      if (url.pathname === '/health') {
        return new Response(JSON.stringify({
          status: 'ok',
          timestamp: Date.now(),
          version: '1.0.0'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Serve static assets
      return await handleStaticRequest(request, env, ctx);
      
    } catch (error) {
      console.error('Worker error:', error);
      
      return new Response(JSON.stringify({
        error: 'Internal server error',
        timestamp: Date.now()
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  },

  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    // Cron handler for pre-warming weather cache
    switch (controller.cron) {
      case '*/15 * * * *': // Every 15 minutes
        ctx.waitUntil(preWarmWeatherCache(env));
        break;
    }
  }
};

async function handleApiRequest(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);
  
  // CORS headers for all API responses
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
  
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  
  try {
    let response: Response;
    
    // Route to appropriate handler
    if (url.pathname.startsWith('/api/telemetry')) {
      response = await handleTelemetryRequest(request, env);
    } else if (url.pathname.startsWith('/api/mapbox/')) {
      response = await handleMapboxProxy(request, env);
    } else if (url.pathname.startsWith('/api/weather')) {
      response = await handleWeatherRequest(request, env);
    } else if (url.pathname.startsWith('/api/')) {
      // Existing API routes - delegate to api worker
      response = await env.aww_api?.fetch(request) || new Response('API service unavailable', { status: 503 });
    } else {
      response = new Response(JSON.stringify({ error: 'Endpoint not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Add CORS headers to response
    const newHeaders = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      newHeaders.set(key, value);
    });
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
    
  } catch (error) {
    console.error('API request error:', error);
    
    return new Response(JSON.stringify({
      error: 'API request failed',
      timestamp: Date.now()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

async function handleTelemetryRequest(request: Request, env: Env): Promise<Response> {
  // Get or create Durable Object instance
  const id = env.TELEMETRY_DO?.idFromName('main-telemetry');
  if (!id) {
    return new Response(JSON.stringify({ error: 'Telemetry service unavailable' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const stub = env.TELEMETRY_DO?.get(id);
  if (!stub) {
    return new Response(JSON.stringify({ error: 'Telemetry service unavailable' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Forward request to Durable Object
  const doRequest = new Request('/latest', {
    method: request.method,
    headers: request.headers,
    body: request.body
  });
  
  return await stub.fetch(doRequest);
}

async function handleStaticRequest(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  try {
    // Use KV asset handler for static files
    const response = await getAssetFromKV(
      {
        request,
        waitUntil: ctx.waitUntil.bind(ctx)
      },
      {
        ASSET_NAMESPACE: env.__STATIC_CONTENT,
        ASSET_MANIFEST: JSON.parse(__STATIC_CONTENT_MANIFEST || '{}'),
        cacheControl: {
          browserTTL: 86400,    // 1 day
          edgeTTL: 86400 * 7,   // 1 week
          bypassCache: false
        },
        mapRequestToAsset: (request: Request) => {
          const url = new URL(request.url);
          
          // Handle SPA routing - serve index.html for non-asset paths
          if (!url.pathname.includes('.') && !url.pathname.startsWith('/api/')) {
            return new Request(`${url.origin}/index.html`, request);
          }
          
          return request;
        }
      }
    );
    
    // Add security headers
    const headers = new Headers(response.headers);
    headers.set('X-Frame-Options', 'DENY');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://api.mapbox.com; " +
      "style-src 'self' 'unsafe-inline' https://api.mapbox.com; " +
      "img-src 'self' data: https: blob:; " +
      "connect-src 'self' https://api.mapbox.com https://api.tessie.com https://api.openweathermap.org; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "worker-src 'self' blob:;"
    );
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: headers
    });
    
  } catch (error) {
    console.error('Static asset error:', error);
    
    // Fallback to basic index.html
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>A Whittle Wandering</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body>
          <div id="root">
            <h1>A Whittle Wandering</h1>
            <p>Loading...</p>
          </div>
        </body>
      </html>
    `, {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8'
      }
    });
  }
}
