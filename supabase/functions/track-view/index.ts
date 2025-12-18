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

// Parse user agent for device/browser/os info
function parseUserAgent(ua: string): { 
  device_type: string; 
  browser: string; 
  browser_version: string; 
  os: string; 
  os_version: string;
} {
  let device_type = 'Desktop';
  if (/Mobile|Android|iPhone|iPod/.test(ua)) device_type = 'Mobile';
  else if (/iPad|Tablet/.test(ua)) device_type = 'Tablet';
  
  let browser = 'Unknown';
  let browser_version = '';
  if (ua.includes('Firefox/')) {
    browser = 'Firefox';
    browser_version = ua.match(/Firefox\/(\d+\.\d+)/)?.[1] || '';
  } else if (ua.includes('Edg/')) {
    browser = 'Edge';
    browser_version = ua.match(/Edg\/(\d+\.\d+)/)?.[1] || '';
  } else if (ua.includes('Chrome/')) {
    browser = 'Chrome';
    browser_version = ua.match(/Chrome\/(\d+\.\d+)/)?.[1] || '';
  } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
    browser = 'Safari';
    browser_version = ua.match(/Version\/(\d+\.\d+)/)?.[1] || '';
  } else if (ua.includes('Opera/') || ua.includes('OPR/')) {
    browser = 'Opera';
    browser_version = ua.match(/(?:Opera|OPR)\/(\d+\.\d+)/)?.[1] || '';
  }
  
  let os = 'Unknown';
  let os_version = '';
  if (ua.includes('Windows NT')) {
    os = 'Windows';
    const ntVersion = ua.match(/Windows NT (\d+\.\d+)/)?.[1];
    if (ntVersion === '10.0') os_version = '10/11';
    else if (ntVersion === '6.3') os_version = '8.1';
    else if (ntVersion === '6.2') os_version = '8';
    else if (ntVersion === '6.1') os_version = '7';
  } else if (ua.includes('Mac OS X')) {
    os = 'macOS';
    os_version = ua.match(/Mac OS X (\d+[._]\d+)/)?.[1]?.replace('_', '.') || '';
  } else if (ua.includes('Linux')) {
    os = 'Linux';
  } else if (ua.includes('Android')) {
    os = 'Android';
    os_version = ua.match(/Android (\d+\.\d+)/)?.[1] || '';
  } else if (ua.includes('iPhone') || ua.includes('iPad')) {
    os = 'iOS';
    os_version = ua.match(/OS (\d+_\d+)/)?.[1]?.replace('_', '.') || '';
  }
  
  return { device_type, browser, browser_version, os, os_version };
}

// In-memory rate limiting (per instance)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000;
const MAX_REQUESTS_PER_WINDOW = 30;

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

function cleanupRateLimitMap() {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

// Parse UTM parameters from referrer or provided URL
function parseUtmParams(url: string | null): {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
} {
  if (!url) return { utm_source: null, utm_medium: null, utm_campaign: null, utm_term: null, utm_content: null };
  
  try {
    const urlObj = new URL(url);
    return {
      utm_source: urlObj.searchParams.get('utm_source'),
      utm_medium: urlObj.searchParams.get('utm_medium'),
      utm_campaign: urlObj.searchParams.get('utm_campaign'),
      utm_term: urlObj.searchParams.get('utm_term'),
      utm_content: urlObj.searchParams.get('utm_content'),
    };
  } catch {
    return { utm_source: null, utm_medium: null, utm_campaign: null, utm_term: null, utm_content: null };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    
    if (isRateLimited(ip)) {
      console.warn(`Rate limit exceeded for IP: ${ip}`);
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' } 
        }
      );
    }
    
    if (Math.random() < 0.1) cleanupRateLimitMap();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { 
      page_path, 
      journey_id,
      screen_width,
      screen_height,
      language,
      timezone,
      session_id,
      scroll_depth_percent,
      time_on_page_ms,
      click_count,
      is_bounce,
      entry_page,
      exit_page,
      page_url,
      connection_type
    } = body;

    if (!page_path) {
      return new Response(
        JSON.stringify({ error: 'page_path is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (typeof page_path !== 'string' || page_path.length > 200) {
      return new Response(
        JSON.stringify({ error: 'Invalid page_path' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userAgent = req.headers.get('user-agent') || 'unknown';
    const visitorId = hashString(`${userAgent}-${ip}-${new Date().toDateString()}`);
    const referrer = req.headers.get('referer') || null;
    const acceptLanguage = req.headers.get('accept-language')?.split(',')[0] || null;
    
    // Parse device info
    const deviceInfo = parseUserAgent(userAgent);
    
    // Parse UTM params from page URL or referrer
    const utmParams = parseUtmParams(page_url || referrer);
    
    // Check if returning visitor (has previous views)
    const { count: previousViews } = await supabase
      .from('page_views')
      .select('*', { count: 'exact', head: true })
      .eq('visitor_id', visitorId);
    
    const isReturningVisitor = (previousViews || 0) > 0;

    // Insert page view with all details
    const { error } = await supabase
      .from('page_views')
      .insert({
        page_path: page_path.substring(0, 200),
        journey_id: journey_id || null,
        visitor_id: visitorId,
        user_agent: userAgent.substring(0, 500),
        referrer: referrer?.substring(0, 500) || null,
        screen_width: screen_width || null,
        screen_height: screen_height || null,
        language: language || acceptLanguage,
        timezone: timezone || null,
        session_id: session_id || visitorId,
        scroll_depth_percent: scroll_depth_percent || null,
        time_on_page_ms: time_on_page_ms || null,
        click_count: click_count || 0,
        is_bounce: is_bounce || false,
        entry_page: entry_page || false,
        exit_page: exit_page || false,
        device_type: deviceInfo.device_type,
        browser: deviceInfo.browser,
        browser_version: deviceInfo.browser_version,
        os: deviceInfo.os,
        os_version: deviceInfo.os_version,
        connection_type: connection_type || null,
        is_returning_visitor: isReturningVisitor,
        utm_source: utmParams.utm_source,
        utm_medium: utmParams.utm_medium,
        utm_campaign: utmParams.utm_campaign,
        utm_term: utmParams.utm_term,
        utm_content: utmParams.utm_content,
      });

    if (error) {
      console.error('Error inserting page view:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to track view' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: stats } = await supabase.rpc('get_flagship_view_count');

    console.log(`Page view tracked: ${page_path}, visitor: ${visitorId}, device: ${deviceInfo.device_type}, browser: ${deviceInfo.browser}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        visitor_id: visitorId,
        is_returning: isReturningVisitor,
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
