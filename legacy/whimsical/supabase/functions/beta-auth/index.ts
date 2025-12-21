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
      // Only joe@awhittlewandering.com should show password field
      const isJoeAccount = sanitizedEmail === 'joe@awhittlewandering.com';
      return new Response(
        JSON.stringify({ 
          success: true,
          existingUser: isJoeAccount && !!existingUser,
          requiresPassword: isJoeAccount && !!existingUser
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

    // Keep original case - access codes are case-sensitive
    const sanitizedCode = access_code.trim();
    
    if (sanitizedCode.length < 10 || sanitizedCode.length > 64) {
      console.log(`[Beta Auth] Invalid code format: length=${sanitizedCode.length}`);
      return new Response(
        JSON.stringify({ error: 'Invalid access code format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Beta Auth] Verifying: email=${sanitizedEmail}, code_prefix=${sanitizedCode.substring(0, 8)}...`);

    // Verify the email + access code combination in beta_testers
    const { data: tester, error: verifyError } = await supabaseAdmin
      .from('beta_testers')
      .select('id, name, email, access_code, expires_at, is_active, access_count')
      .eq('email', sanitizedEmail)
      .eq('access_code', sanitizedCode)
      .eq('is_active', true)
      .single();

    if (verifyError || !tester) {
      console.log(`[Beta Auth] Verification failed: email=${sanitizedEmail}, error=${verifyError?.message || 'No matching record'}`);
      
      // Log the failed attempt
      await supabaseAdmin.from('login_attempts').insert({
        email: sanitizedEmail,
        success: false,
        failure_reason: 'beta_access_code_mismatch',
        access_code_attempted: sanitizedCode.substring(0, 8) + '...',
        auth_method: 'beta_access'
      });
      
      // Check if the email exists but with a different code
      const { data: emailExists } = await supabaseAdmin
        .from('beta_testers')
        .select('email')
        .eq('email', sanitizedEmail)
        .single();
      
      if (emailExists) {
        return new Response(
          JSON.stringify({ error: 'Invalid access code for this email' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Check if the code exists but for a different email
      const { data: codeExists } = await supabaseAdmin
        .from('beta_testers')
        .select('email')
        .eq('access_code', sanitizedCode)
        .single();
      
      if (codeExists) {
        return new Response(
          JSON.stringify({ error: `This access code is registered to a different email` }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Invalid email or access code' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Beta Auth] Tester verified: ${tester.name} (${tester.email})`);


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
        access_count: (tester.access_count || 0) + 1,
        claimed_by_user_id: existingUser?.id || null,
        claimed_at: existingUser ? new Date().toISOString() : null
      })
      .eq('id', tester.id);

    // Log successful attempt
    await supabaseAdmin.from('login_attempts').insert({
      email: sanitizedEmail,
      success: true,
      access_code_attempted: sanitizedCode.substring(0, 8) + '...',
      auth_method: 'beta_access'
    });

    // Special handling for joe@awhittlewandering.com - requires password
    if (sanitizedEmail === 'joe@awhittlewandering.com' && existingUser) {
      console.log(`[Beta Auth] Joe's account verified, requires password login`);
      return new Response(
        JSON.stringify({ 
          success: true,
          existingUser: true,
          requiresPassword: true,
          email: sanitizedEmail,
          name: tester.name
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For any other email with existing user (shouldn't happen normally)
    if (existingUser) {
      console.log(`[Beta Auth] Existing user ${sanitizedEmail} - signing in with access code`);
      return new Response(
        JSON.stringify({ 
          success: true,
          existingUser: true,
          email: sanitizedEmail,
          password: sanitizedCode,
          name: tester.name
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // New user: create account with access code as password
    console.log(`[Beta Auth] Creating new account for ${sanitizedEmail}`);
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: sanitizedEmail,
      password: sanitizedCode,
      email_confirm: true,
      user_metadata: {
        full_name: tester.name,
        beta_tester: true,
      }
    });

    if (createError) {
      console.error('[Beta Auth] Error creating user:', createError);
      return new Response(
        JSON.stringify({ error: 'Failed to provision account' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update claimed_by now that we have the user ID
    await supabaseAdmin
      .from('beta_testers')
      .update({ 
        claimed_by_user_id: newUser.user.id,
        claimed_at: new Date().toISOString()
      })
      .eq('id', tester.id);

    console.log(`[Beta Auth] Created beta account for ${sanitizedEmail}`);

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
    console.error('[Beta Auth] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
