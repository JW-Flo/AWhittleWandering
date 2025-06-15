/**
 * API Worker - Handles data services for awhittlewandering.com/api/*
 * 
 * Responsibilities:
 * - Trip telemetry data
 * - GPT-powered summarization
 * - Map data and waypoints
 * - Authentication for private endpoints
 */

import { Env, ExecutionContext } from '../packages/shared/types';
import { Router } from 'itty-router';
import { z } from 'zod';

// Create a new router
const router = Router();

// Constants
const API_VERSION = 'v1';
const ONE_DAY_IN_SECONDS = 86400;

// Schema for trip telemetry data
const TelemetrySchema = z.object({
  timestamp: z.number(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  speed: z.number().min(0).optional(),
  batteryLevel: z.number().min(0).max(100).optional(),
  heading: z.number().min(0).max(360).optional(),
  altitude: z.number().optional(),
  charging: z.boolean().optional(),
  temperature: z.number().optional(),
  tripDay: z.number().min(1).max(60).optional(),
  stateCode: z.string().max(2).optional(),
});

/**
 * Helper to parse request body as JSON
 */
async function parseJsonBody(request: Request) {
  try {
    return await request.json();
  } catch (error) {
    return null;
  }
}

/**
 * Middleware to require authentication
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
 * Helper to create a JSON response
 */
function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    }
  });
}

/**
 * Root API endpoint - returns basic info
 */
router.get('/api', () => {
  return jsonResponse({
    name: 'A Whittle Wandering API',
    version: API_VERSION,
    status: 'operational',
    docs: '/api/docs'
  });
});

/**
 * API documentation endpoint
 */
router.get('/api/docs', () => {
  return jsonResponse({
    endpoints: [
      { path: '/api', method: 'GET', description: 'API information' },
      { path: '/api/docs', method: 'GET', description: 'API documentation' },
      { path: '/api/trip/current', method: 'GET', description: 'Current trip status' },
      { path: '/api/trip/day/:day', method: 'GET', description: 'Get trip data for a specific day' },
      { path: '/api/trip/telemetry', method: 'POST', description: 'Submit telemetry data', auth: true },
      { path: '/api/summary/:day', method: 'GET', description: 'Get AI-generated summary for a day' }
    ]
  });
});

/**
 * Get current trip status
 */
router.get('/api/trip/current', async (request: Request, env: Env) => {
  try {
    // Try to get the current trip day from KV
    const currentDayData = await env.TRIP_DATA?.get('.current_trip_day.json', { type: 'json' });
    
    if (!currentDayData) {
      return jsonResponse({
        error: 'No current trip data available'
      }, 404);
    }
    
    // Get the latest telemetry entry for this day
    const day = currentDayData.day;
    const telemetryKey = `day_${day}_telemetry.json`;
    const telemetryData = await env.TRIP_DATA?.get(telemetryKey, { type: 'json' });
    
    // Combine the data
    return jsonResponse({
      ...currentDayData,
      telemetry: telemetryData?.slice(-1)[0] || null
    });
  } catch (error) {
    console.error('Error fetching current trip data:', error);
    return jsonResponse({
      error: 'Failed to fetch current trip data'
    }, 500);
  }
});

/**
 * Get trip data for a specific day
 */
router.get('/api/trip/day/:day', async (request: Request, env: Env, context: { params: { day: string } }) => {
  try {
    const day = parseInt(context.params.day, 10);
    
    if (isNaN(day) || day < 1 || day > 60) {
      return jsonResponse({
        error: 'Invalid day parameter. Must be between 1 and 60.'
      }, 400);
    }
    
    // Get the itinerary for this day
    const itineraryKey = `day_${day}_itinerary.json`;
    const itineraryData = await env.TRIP_DATA?.get(itineraryKey, { type: 'json' });
    
    // Get the telemetry for this day
    const telemetryKey = `day_${day}_telemetry.json`;
    const telemetryData = await env.TRIP_DATA?.get(telemetryKey, { type: 'json' });
    
    if (!itineraryData && !telemetryData) {
      return jsonResponse({
        error: `No data available for day ${day}`
      }, 404);
    }
    
    return jsonResponse({
      day,
      itinerary: itineraryData || null,
      telemetry: telemetryData || []
    });
  } catch (error) {
    console.error(`Error fetching data for day ${context.params.day}:`, error);
    return jsonResponse({
      error: 'Failed to fetch trip data'
    }, 500);
  }
});

/**
 * Submit telemetry data (authenticated)
 */
router.post('/api/trip/telemetry', async (request: Request, env: Env) => {
  // Check authentication
  const authResult = await requireAuth(request, env);
  if (authResult instanceof Response) {
    return authResult;
  }
  
  try {
    const body = await parseJsonBody(request);
    
    if (!body) {
      return jsonResponse({
        error: 'Invalid JSON body'
      }, 400);
    }
    
    // Validate the telemetry data
    const validationResult = TelemetrySchema.safeParse(body);
    
    if (!validationResult.success) {
      // Log validation errors internally
      console.error('Telemetry validation failed:', validationResult.error.errors);
      return jsonResponse({
        error: 'Invalid telemetry data'
      }, 400);
    }
    
    const telemetry = validationResult.data;
    const tripDay = telemetry.tripDay || 1; // Default to day 1 if not specified
    
    // Store the telemetry data in KV
    const telemetryKey = `day_${tripDay}_telemetry.json`;
    
    // Get existing telemetry for this day
    const existingData = await env.TRIP_DATA?.get(telemetryKey, { type: 'json' }) || [];
    
    // Add the new telemetry and save back to KV
    existingData.push({
      ...telemetry,
      receivedAt: Date.now()
    });
    
    await env.TRIP_DATA?.put(telemetryKey, JSON.stringify(existingData));
    
    // Update current trip day
    await env.TRIP_DATA?.put('.current_trip_day.json', JSON.stringify({
      day: tripDay,
      updatedAt: Date.now()
    }));
    
    return jsonResponse({
      success: true,
      message: 'Telemetry data saved'
    });
  } catch (error) {
    console.error('Error saving telemetry data:', error);
    return jsonResponse({
      error: 'Failed to save telemetry data'
    }, 500);
  }
});

/**
 * Get AI-generated summary for a day
 */
router.get('/api/summary/:day', async (request: Request, env: Env, context: { params: { day: string } }) => {
  try {
    const day = parseInt(context.params.day, 10);
    
    if (isNaN(day) || day < 1 || day > 60) {
      return jsonResponse({
        error: 'Invalid day parameter. Must be between 1 and 60.'
      }, 400);
    }
    
    // Check if we have a cached summary
    const summaryKey = `day_${day}_summary.json`;
    const cachedSummary = await env.TRIP_DATA?.get(summaryKey, { type: 'json' });
    
    // If we have a recent cached summary, return it
    if (
      cachedSummary &&
      (Date.now() - Number(cachedSummary.generatedAt)) < ONE_DAY_IN_SECONDS * 1000
    ) {
      return jsonResponse(cachedSummary);
    }
    
    // Get the trip data for this day
    const itineraryKey = `day_${day}_itinerary.json`;
    const telemetryKey = `day_${day}_telemetry.json`;
    
    const [itineraryData, telemetryData] = await Promise.all([
      env.TRIP_DATA?.get(itineraryKey, { type: 'json' }),
      env.TRIP_DATA?.get(telemetryKey, { type: 'json' })
    ]);
    
    if (!itineraryData && !telemetryData) {
      return jsonResponse({
        error: `No data available for day ${day}`
      }, 404);
    }
    
    // Generate a summary using AI Gateway if available
    if (env.AI_GATEWAY) {
      try {
        // Prepare the prompt with trip data
        const prompt = `
          Generate a brief summary of Day ${day} of the A Whittle Wandering road trip.
          
          Itinerary data:
          ${JSON.stringify(itineraryData || 'No itinerary data available')}
          
          Telemetry data (showing first and last points):
          ${JSON.stringify(telemetryData ? 
            [telemetryData[0], telemetryData[telemetryData.length - 1]] : 
            'No telemetry data available'
          )}
          
          Please provide:
          1. A title for the day
          2. A 2-3 sentence overview
          3. Key highlights (up to 3)
          4. Weather encountered
          5. Total distance traveled
          6. States visited
        `;
        
        // Call the AI Gateway
        const response = await env.AI_GATEWAY.run('@cf/meta/llama-2-7b-chat-int8', {
          messages: [{ role: 'user', content: prompt }]
        });
        
        // Parse the generated content
        const summary = {
          day,
          content: response.response,
          generatedAt: Date.now()
        };
        
        // Cache the summary
        await env.TRIP_DATA?.put(summaryKey, JSON.stringify(summary));
        
        return jsonResponse(summary);
      } catch (error) {
        console.error('Error generating summary with AI:', error);
        // Fall back to a simple summary if AI fails
      }
    }
    
    // Fallback if AI Gateway is not available or fails
    const fallbackSummary = {
      day,
      content: `
        # Day ${day} of A Whittle Wandering
        
        A summary is not available at this time. Please check back later.
        
        ${itineraryData ? 
          `Planned stops: ${itineraryData.stops?.map((stop: any) => stop.location).join(', ')}` : 
          'Itinerary data not available.'
        }
      `,
      generatedAt: Date.now(),
      isGenerated: false
    };
    
    await env.TRIP_DATA?.put(summaryKey, JSON.stringify(fallbackSummary));
    
    return jsonResponse(fallbackSummary);
  } catch (error) {
    console.error(`Error generating summary for day ${context.params.day}:`, error);
    return jsonResponse({
      error: 'Failed to generate summary'
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
 * Main handler for API requests
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Set CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
      // Clone the request before consuming its body
      const response = await router.handle(request.clone(), env);
      
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
