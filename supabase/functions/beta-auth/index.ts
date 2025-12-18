import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, access_code, check_only } = await req.json();

    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sanitizedEmail = email.trim().toLowerCase();

    // Create admin client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Check if user already exists in auth
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === sanitizedEmail);

    // If just checking if user exists (for UI flow)
    if (check_only) {
      return new Response(
        JSON.stringify({ 
          success: true,
          existingUser: !!existingUser
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For actual auth, we need access code
    if (!access_code || typeof access_code !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Access code is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sanitizedCode = access_code.trim().toUpperCase();
    
    if (sanitizedCode.length < 10 || sanitizedCode.length > 64) {
      return new Response(
        JSON.stringify({ error: 'Invalid access code format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the email + access code combination in beta_testers
    const { data: tester, error: verifyError } = await supabaseAdmin
      .from('beta_testers')
      .select('id, name, email, access_code, expires_at, is_active, access_count')
      .eq('email', sanitizedEmail)
      .eq('access_code', sanitizedCode)
      .eq('is_active', true)
      .single();

    if (verifyError || !tester) {
      return new Response(
        JSON.stringify({ error: 'Invalid email or access code' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check expiry
    if (tester.expires_at && new Date(tester.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Access code has expired' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Record the access
    await supabaseAdmin
      .from('beta_testers')
      .update({ 
        last_accessed_at: new Date().toISOString(),
        access_count: (tester.access_count || 0) + 1
      })
      .eq('id', tester.id);

    if (existingUser) {
      // Existing user - they are verified, return flag for password entry
      console.log(`Existing user ${sanitizedEmail} verified for beta access`);

      return new Response(
        JSON.stringify({ 
          success: true,
          existingUser: true,
          email: sanitizedEmail,
          name: tester.name
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // New user: create account with access code as password
    const { error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: sanitizedEmail,
      password: sanitizedCode,
      email_confirm: true,
      user_metadata: {
        full_name: tester.name,
        beta_tester: true,
      }
    });

    if (createError) {
      console.error('Error creating user:', createError);
      return new Response(
        JSON.stringify({ error: 'Failed to provision account' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Created beta account for ${sanitizedEmail}`);

    // Return credentials for new user sign-in
    return new Response(
      JSON.stringify({ 
        success: true,
        existingUser: false,
        email: sanitizedEmail,
        password: sanitizedCode,
        name: tester.name
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Beta auth error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
