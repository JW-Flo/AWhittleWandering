import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting maps
const userRateLimitMap = new Map<string, { count: number; resetTime: number }>();
const ipRateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Different limits for authenticated vs unauthenticated
const AUTH_MAX_REQUESTS = 10;
const UNAUTH_MAX_REQUESTS = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

function checkRateLimit(key: string, isAuthenticated: boolean): boolean {
  const now = Date.now();
  const limitMap = isAuthenticated ? userRateLimitMap : ipRateLimitMap;
  const maxRequests = isAuthenticated ? AUTH_MAX_REQUESTS : UNAUTH_MAX_REQUESTS;
  
  const record = limitMap.get(key);
  
  if (!record || now > record.resetTime) {
    limitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}

function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         req.headers.get('x-real-ip') ||
         req.headers.get('cf-connecting-ip') ||
         'unknown';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MAPBOX_TOKEN = Deno.env.get('MAPBOX_TOKEN');
    if (!MAPBOX_TOKEN) {
      console.error('[get-mapbox-token] Mapbox token not configured');
      return new Response(JSON.stringify({ error: 'Service temporarily unavailable' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Try to get authenticated user (optional)
    const authHeader = req.headers.get('authorization');
    let userId: string | null = null;
    
    if (authHeader) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: authHeader } }
        });

        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id || null;
      } catch (e) {
        // Auth failed, continue as unauthenticated
        console.log('[get-mapbox-token] Auth check failed, continuing as unauthenticated');
      }
    }

    // Rate limit based on user ID (authenticated) or IP (unauthenticated)
    const isAuthenticated = !!userId;
    const rateLimitKey = isAuthenticated ? userId! : getClientIP(req);
    
    if (!checkRateLimit(rateLimitKey, isAuthenticated)) {
      console.warn(`[get-mapbox-token] Rate limit exceeded for ${isAuthenticated ? 'user' : 'IP'}: ${rateLimitKey}`);
      return new Response(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[get-mapbox-token] Returning token for ${isAuthenticated ? 'user: ' + userId : 'unauthenticated IP: ' + rateLimitKey}`);
    return new Response(JSON.stringify({ token: MAPBOX_TOKEN }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[get-mapbox-token] Error:', error);
    return new Response(JSON.stringify({ error: 'An unexpected error occurred' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
