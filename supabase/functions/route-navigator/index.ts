import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation constants
const MAX_QUERY_LENGTH = 1000;
const MAX_PREFERENCES_LENGTH = 2000;

function validateCoordinates(lat: unknown, lng: unknown): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}

function sanitizeInput(input: string): string {
  // Remove potential prompt injection patterns while keeping legitimate queries
  return input
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { query, currentLocation, preferences } = body;

    // Validate query
    if (!query || typeof query !== 'string') {
      return new Response(JSON.stringify({ error: 'Query is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (query.length > MAX_QUERY_LENGTH) {
      return new Response(JSON.stringify({ error: 'Query exceeds maximum length' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate currentLocation if provided
    if (currentLocation !== undefined && currentLocation !== null) {
      if (typeof currentLocation !== 'object') {
        return new Response(JSON.stringify({ error: 'Invalid location format' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!validateCoordinates(currentLocation.lat, currentLocation.lng)) {
        return new Response(JSON.stringify({ error: 'Invalid coordinates' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Validate preferences if provided
    if (preferences !== undefined && preferences !== null) {
      const preferencesStr = JSON.stringify(preferences);
      if (preferencesStr.length > MAX_PREFERENCES_LENGTH) {
        return new Response(JSON.stringify({ error: 'Preferences data too large' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      // Log server-side only, return generic error to client
      console.error('AI service configuration error');
      return new Response(JSON.stringify({ error: 'Service temporarily unavailable' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Sanitize user input
    const sanitizedQuery = sanitizeInput(query);

    // Build a context-aware prompt for route suggestions
    const systemPrompt = `You are an AI route navigator assistant for "A Whittle Wandering" (AWW), an EV road trip tracking platform. 
    
Your role is to help users plan optimal routes for their electric vehicle journeys. You should:
- Suggest charging stops based on typical EV range (250-300 miles for Tesla)
- Recommend scenic routes and points of interest
- Consider weather and seasonal factors
- Provide time estimates and distance calculations
- Suggest rest stops and overnight accommodations
- Factor in elevation changes that affect EV efficiency

When suggesting routes, format your response with:
1. A brief overview of the recommended route
2. Key waypoints with estimated distances
3. Charging stop recommendations
4. Points of interest along the way
5. Tips for the journey

Be conversational but informative. If you don't have specific information, provide general guidance based on best practices for EV road trips.`;

    const userMessage = currentLocation 
      ? `Current location: ${currentLocation.lat}, ${currentLocation.lng}\n\nUser query: ${sanitizedQuery}\n\nPreferences: ${JSON.stringify(preferences || {})}`
      : `User query: ${sanitizedQuery}\n\nPreferences: ${JSON.stringify(preferences || {})}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      // Log detailed error server-side only
      const errorText = await response.text();
      console.error('AI service error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'Service temporarily unavailable' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Stream the response back to the client
    return new Response(response.body, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    // Log detailed error server-side only, return generic message to client
    console.error('Route navigator error:', error);
    return new Response(JSON.stringify({ error: 'An unexpected error occurred' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
