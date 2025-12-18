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

// In-memory rate limiting (per instance)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30; // 30 requests per minute per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }
  
  record.count++;
  return false;
}

// Cleanup old entries periodically
function cleanupRateLimitMap() {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract IP for rate limiting
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    
    // Check rate limit
    if (isRateLimited(ip)) {
      console.warn(`Rate limit exceeded for IP: ${ip}`);
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': '60'
          } 
        }
      );
    }
    
    // Periodic cleanup
    if (Math.random() < 0.1) {
      cleanupRateLimitMap();
    }

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
    
    // Validate page_path length and format
    if (typeof page_path !== 'string' || page_path.length > 200) {
      return new Response(
        JSON.stringify({ error: 'Invalid page_path' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create anonymous visitor ID from user agent + IP (no PII stored)
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const visitorId = hashString(`${userAgent}-${ip}-${new Date().toDateString()}`);
    
    const referrer = req.headers.get('referer') || null;

    // Insert page view
    const { error } = await supabase
      .from('page_views')
      .insert({
        page_path: page_path.substring(0, 200),
        journey_id: journey_id || null,
        visitor_id: visitorId,
        user_agent: userAgent.substring(0, 500),
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
