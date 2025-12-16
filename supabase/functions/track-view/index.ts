import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple hash function to create anonymous visitor ID
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { page_path, journey_id } = await req.json();

    if (!page_path) {
      return new Response(
        JSON.stringify({ error: 'page_path is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create anonymous visitor ID from user agent + IP (no PII stored)
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    const visitorId = hashString(`${userAgent}-${ip}-${new Date().toDateString()}`);
    
    const referrer = req.headers.get('referer') || null;

    // Insert page view
    const { error } = await supabase
      .from('page_views')
      .insert({
        page_path,
        journey_id: journey_id || null,
        visitor_id: visitorId,
        user_agent: userAgent.substring(0, 500), // Limit length
        referrer: referrer?.substring(0, 500) || null,
      });

    if (error) {
      console.error('Error inserting page view:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to track view' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get updated stats
    const { data: stats } = await supabase
      .rpc('get_flagship_view_count');

    console.log(`Page view tracked: ${page_path}, visitor: ${visitorId}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        stats: stats?.[0] || { total_views: 1, unique_visitors: 1 }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Track view error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});