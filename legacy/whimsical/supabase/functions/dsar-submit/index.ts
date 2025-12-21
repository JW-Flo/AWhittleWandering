import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory rate limiting (per IP)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const MAX_REQUESTS_PER_HOUR = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  
  if (record.count >= MAX_REQUESTS_PER_HOUR) {
    return false;
  }
  
  record.count++;
  return true;
}

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Input sanitization - escape HTML to prevent XSS in stored data
function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .trim();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP for rate limiting
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('cf-connecting-ip') || 
                     'unknown';
    
    // Check rate limit
    if (!checkRateLimit(clientIp)) {
      console.warn(`[dsar-submit] Rate limit exceeded for IP: ${clientIp}`);
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user if authenticated (optional)
    let userId = '00000000-0000-0000-0000-000000000000'; // Anonymous
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        userId = user.id;
      }
    }

    const body = await req.json();
    const { request_type, email, name, details } = body;

    // Validate required fields
    if (!request_type || !email || !name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: request_type, email, and name are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate request_type
    const validRequestTypes = ['access', 'deletion', 'rectification', 'portability', 'objection'];
    if (!validRequestTypes.includes(request_type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    if (!EMAIL_REGEX.test(email) || email.length > 254) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate name length
    if (typeof name !== 'string' || name.trim().length === 0 || name.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Name must be between 1 and 100 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate details length if provided
    if (details && (typeof details !== 'string' || details.length > 5000)) {
      return new Response(
        JSON.stringify({ error: 'Details must not exceed 5000 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize inputs
    const sanitizedEmail = sanitizeInput(email.toLowerCase());
    const sanitizedName = sanitizeInput(name);
    const sanitizedDetails = details ? sanitizeInput(details) : '';

    // Check for existing pending DSAR from same email within last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: existingRequests, error: checkError } = await supabase
      .from('security_audit_log')
      .select('id, metadata, created_at')
      .eq('action', 'dsar_submit')
      .eq('resource_type', 'dsar_request')
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (checkError) {
      console.error('[dsar-submit] Error checking existing requests:', checkError);
    } else if (existingRequests) {
      // Check if any existing request matches this email
      const duplicateRequest = existingRequests.find(req => {
        const metadata = req.metadata as { email?: string; status?: string };
        return metadata?.email === sanitizedEmail && metadata?.status === 'pending';
      });

      if (duplicateRequest) {
        console.warn(`[dsar-submit] Duplicate request blocked for email: ${sanitizedEmail}`);
        return new Response(
          JSON.stringify({ 
            error: 'A pending request from this email already exists. Please wait for it to be processed before submitting another request.',
            existing_request_date: duplicateRequest.created_at
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Log service role operation for audit
    console.log(`[dsar-submit] Service role operation: inserting DSAR for ${sanitizedEmail} from IP ${clientIp}`);

    // Insert DSAR request using service role
    const { data, error } = await supabase
      .from('security_audit_log')
      .insert({
        user_id: userId,
        action: 'dsar_submit',
        resource_type: 'dsar_request',
        ip_address: clientIp,
        metadata: {
          request_type,
          email: sanitizedEmail,
          name: sanitizedName,
          details: sanitizedDetails,
          submitted_at: new Date().toISOString(),
          is_authenticated: userId !== '00000000-0000-0000-0000-000000000000',
          status: 'pending'
        }
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting DSAR:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to submit request' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[dsar-submit] DSAR ${request_type} submitted by ${sanitizedEmail} from IP ${clientIp}`);

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('DSAR submit error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
