/**
 * Dispatch Worker - Handles multi-tenant plugins via Workers for Platforms
 * 
 * Responsibilities:
 * - User-supplied functions running in isolated environments
 * - Plugin system for extensibility
 * - Dispatches requests to the appropriate function
 * - Uses Cloudflare's Workers for Platforms
 */

import { Env, ExecutionContext } from '../packages/shared/types';
import { Router } from 'itty-router';

// Create a new router
const router = Router();

// Security headers for all responses
const SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self';",
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};

/**
 * Helper to create JSON responses
 */
function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...SECURITY_HEADERS
    }
  });
}

/**
 * Authentication middleware for dispatch endpoints
 */
async function requireAuth(request: Request, env: Env) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  
  if (token !== env.MCP_API_KEY) {
    return new Response('Forbidden', { status: 403 });
  }
}

/**
 * Root endpoint - provides basic info about the dispatch system
 */
router.get('/dispatch', () => {
  return jsonResponse({
    name: 'A Whittle Wandering Dispatch API',
    description: 'Run user-defined functions in isolated environments',
    endpoints: [
      { path: '/dispatch', method: 'GET', description: 'API information' },
      { path: '/dispatch/functions', method: 'GET', description: 'List available functions', auth: true },
      { path: '/dispatch/functions/:name', method: 'POST', description: 'Execute a function', auth: true },
      { path: '/dispatch/deploy', method: 'PUT', description: 'Deploy a new function', auth: true }
    ]
  });
});

/**
 * List available functions
 */
router.get('/dispatch/functions', async (request: Request, env: Env) => {
  // Check authentication
  const authResult = await requireAuth(request, env);
  if (authResult instanceof Response) {
    return authResult;
  }
  
  try {
    // In a real implementation, we would query the Workers for Platforms API
    // to get the list of available functions
    
    // For now, return a placeholder response
    return jsonResponse({
      functions: [
        { name: 'hello-world', description: 'A simple hello world function', version: '1.0.0' },
        { name: 'weather-fetch', description: 'Fetch weather data for a location', version: '1.0.0' },
        { name: 'geo-utils', description: 'Geolocation utilities', version: '1.0.0' }
      ]
    });
  } catch (error) {
    console.error('Error listing functions:', error);
    return jsonResponse({
      error: 'Failed to list functions'
    }, 500);
  }
});

/**
 * Execute a function
 */
router.post('/dispatch/functions/:name', async (request: Request, env: Env, context: { params: { name: string } }) => {
  // Check authentication
  const authResult = await requireAuth(request, env);
  if (authResult instanceof Response) {
    return authResult;
  }
  
  try {
    const functionName = context.params.name;
    
    // Get the request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return jsonResponse({
        error: 'Invalid JSON body'
      }, 400);
    }
    
    // Check if the function exists
    const dispatcher = env.DISPATCH;
    if (!dispatcher) {
      return jsonResponse({
        error: 'Dispatch system is not configured'
      }, 501);
    }
    
    // Get the function
    const fn = dispatcher.get(functionName);
    if (!fn) {
      return jsonResponse({
        error: `Function '${functionName}' not found`
      }, 404);
    }
    
    // Create a new request to pass to the function
    const fnRequest = new Request(`https://internal.dispatch/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    // Execute the function
    const response = await fn.fetch(fnRequest, env);
    
    // Return the function's response with our headers
    const responseBody = await response.text();
    const headers = new Headers(response.headers);
    
    // Add security headers
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      headers.set(key, value);
    });
    
    return new Response(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  } catch (error) {
    console.error('Error executing function:', error);
    return jsonResponse({
      error: 'Failed to execute function'
    }, 500);
  }
});

/**
 * Deploy a new function
 */
router.put('/dispatch/deploy', async (request: Request, env: Env) => {
  // Check authentication
  const authResult = await requireAuth(request, env);
  if (authResult instanceof Response) {
    return authResult;
  }
  
  try {
    // Get the request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return jsonResponse({
        error: 'Invalid JSON body'
      }, 400);
    }
    
    // Validate the request body
    const { name, code, metadata } = body;
    
    if (!name || typeof name !== 'string') {
      return jsonResponse({
        error: 'Missing or invalid function name'
      }, 400);
    }
    
    if (!code || typeof code !== 'string') {
      return jsonResponse({
        error: 'Missing or invalid function code'
      }, 400);
    }
    
    // In a real implementation, we would use the Workers for Platforms API
    // to deploy the function
    
    // For now, return a success response
    return jsonResponse({
      success: true,
      message: `Function '${name}' deployed successfully`,
      metadata
    });
  } catch (error) {
    console.error('Error deploying function:', error);
    return jsonResponse({
      error: 'Failed to deploy function'
    }, 500);
  }
});

/**
 * 404 handler for any unmatched routes
 */
router.all('*', () => {
  return jsonResponse({
    error: 'Endpoint not found'
  }, 404);
});

/**
 * Main handler for Dispatch Worker requests
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Set CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };
    
    // Handle OPTIONS requests for CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }
    
    // Route the request through our router
    try {
      const response = await router.handle(request, env);
      
      // Add CORS headers to the response
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
      console.error('Error handling request:', error);
      
      return new Response(JSON.stringify({
        error: 'Internal server error'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  }
};
