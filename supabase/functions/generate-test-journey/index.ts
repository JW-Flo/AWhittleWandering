import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { vehicleMake, vehicleModel, theme } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const prompt = `Generate a unique and creative road trip journey for a ${vehicleMake} ${vehicleModel || 'electric vehicle'}.
Theme/style: ${theme || 'random adventure'}

Return a JSON object with this exact structure (no markdown, just JSON):
{
  "journey": {
    "name": "Creative journey name",
    "description": "2-3 sentence description of this adventure",
    "startLocation": "City, State",
    "duration_days": number between 5-30
  },
  "vehicle": {
    "nickname": "Fun creative nickname for the vehicle",
    "year": realistic year between 2019-2025
  },
  "waypoints": [
    {
      "name": "Location name",
      "city": "City",
      "state": "State code (2 letters)",
      "latitude": number,
      "longitude": number,
      "description": "What happens here",
      "day": day number,
      "battery_level": number 10-100,
      "is_charging_stop": boolean,
      "is_highlight": boolean
    }
  ],
  "stats": {
    "total_miles": realistic number,
    "states_visited": number,
    "charging_stops": number,
    "total_kwh": realistic number
  }
}

Generate 8-15 waypoints across multiple US states. Make it realistic but interesting with scenic stops, charging stations, and memorable locations. Include at least 2 highlight stops (national parks, landmarks, etc).`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'You are a road trip planner that generates realistic EV road trip itineraries. Always respond with valid JSON only, no markdown formatting.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
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
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse JSON from response (handle potential markdown wrapping)
    let journeyData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        journeyData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Content:', content);
      throw new Error('Failed to parse journey data');
    }

    return new Response(JSON.stringify({ success: true, data: journeyData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error generating test journey:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate journey';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
