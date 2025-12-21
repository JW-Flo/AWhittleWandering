import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FETCH_TIMEOUT_MS = 20_000;
const MAX_TEXT_LEN = 500;

function getEnv(name: string): string | null {
  const v = Deno.env.get(name);
  return v && v.trim().length > 0 ? v.trim() : null;
}

async function fetchWithTimeout(input: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

async function sleep(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

async function fetchWithRetry(input: string, init: RequestInit, attempts = 3): Promise<Response> {
  let lastErr: unknown = null;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetchWithTimeout(input, init, FETCH_TIMEOUT_MS);
      if (res.status !== 429 && res.status !== 503) return res;
      // simple backoff with jitter
      const backoff = Math.min(1500 * Math.pow(2, i), 8000) + Math.floor(Math.random() * 250);
      await sleep(backoff);
      lastErr = new Error(`retryable status ${res.status}`);
    } catch (e) {
      lastErr = e;
      const backoff = Math.min(1500 * Math.pow(2, i), 8000) + Math.floor(Math.random() * 250);
      await sleep(backoff);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('AI request failed');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, waypointName, waypointLocation, journeyTheme, vehicleInfo } = await req.json();
    const OPENAI_API_KEY = getEnv('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Service temporarily unavailable'
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let prompt = '';
    let systemPrompt = '';

    // Different AI enhancement actions - supplements user-created content
    if (action === 'enhance_waypoint') {
      // Enhance a single waypoint with rich description
      systemPrompt = `You are a travel writer helping to add depth and color to road trip waypoints. 
Keep responses concise but evocative. Focus on what makes a place special, interesting local facts, 
and the experience of visiting. Be authentic and avoid generic descriptions.`;
      
      prompt = `Add a compelling 2-3 sentence description for this waypoint:
Location: ${waypointName}${waypointLocation ? `, ${waypointLocation}` : ''}
${journeyTheme ? `Journey theme: ${journeyTheme}` : ''}
${vehicleInfo ? `Vehicle: ${vehicleInfo}` : ''}

Return only the description text, no quotes or labels.`;
    } else if (action === 'suggest_highlights') {
      // Suggest what makes a location noteworthy
      systemPrompt = `You are a knowledgeable travel guide. Provide brief, specific highlights about places.`;
      
      prompt = `What are 3 quick highlights or must-see things at ${waypointName}${waypointLocation ? `, ${waypointLocation}` : ''}? 
Return as a simple JSON array of strings, each under 50 characters. Example: ["Historic downtown district", "Best sunset views in state", "Famous local BBQ"]`;
    } else if (action === 'generate_journal_prompt') {
      // Generate a journal writing prompt for the location
      systemPrompt = `You help travelers capture meaningful memories through thoughtful journaling prompts.`;
      
      prompt = `Create a reflective journal prompt for someone visiting ${waypointName}${waypointLocation ? `, ${waypointLocation}` : ''}. 
The prompt should encourage them to capture a personal memory or observation. Keep it under 100 characters.
Return only the prompt text.`;
    } else if (action === 'enhance_journey_description') {
      // Enhance overall journey description
      systemPrompt = `You are a travel writer creating compelling journey narratives.`;
      
      prompt = `Write a captivating 2-3 sentence description for a road trip:
${journeyTheme ? `Theme: ${journeyTheme}` : 'A road trip adventure'}
${waypointLocation ? `Starting from: ${waypointLocation}` : ''}
${vehicleInfo ? `Vehicle: ${vehicleInfo}` : ''}

Make it personal and evocative. Return only the description text.`;
    } else {
      throw new Error(`Unknown action: ${action}. Supported: enhance_waypoint, suggest_highlights, generate_journal_prompt, enhance_journey_description`);
    }

    const safeName = typeof waypointName === 'string' ? waypointName.slice(0, MAX_TEXT_LEN) : '';
    console.log(`[generate-test-journey] Processing action: ${action} for ${safeName || 'journey'}`);

    const baseUrl = getEnv('OPENAI_BASE_URL') ?? 'https://api.openai.com/v1';
    const response = await fetchWithRetry(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: getEnv('OPENAI_MODEL') ?? 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[generate-test-journey] AI service error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Rate limit exceeded. Please try again in a moment.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'AI service unavailable for this request.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI service error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    let result: any = { success: true };

    if (action === 'suggest_highlights') {
      // Parse JSON array for highlights
      try {
        const highlights = JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim());
        result.data = highlights;
      } catch {
        // If not valid JSON, split by newlines or commas
        result.data = content.split(/[\n,]/).map((s: string) => s.replace(/^[-•*\d.)\s]+/, '').trim()).filter((s: string) => s);
      }
    } else {
      result.data = content.trim();
    }

    console.log(`[generate-test-journey] Success for action: ${action}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[generate-test-journey] Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
