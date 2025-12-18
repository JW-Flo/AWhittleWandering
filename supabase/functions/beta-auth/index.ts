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
    const { access_code } = await req.json();

    if (!access_code || typeof access_code !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Access code is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sanitizedCode = access_code.trim().toUpperCase();
    
    // Basic validation
    if (sanitizedCode.length < 10 || sanitizedCode.length > 64) {
      return new Response(
        JSON.stringify({ error: 'Invalid access code format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify the access code and get beta tester info
    const { data: tester, error: verifyError } = await supabaseAdmin
      .from('beta_testers')
      .select('id, name, email, access_code, expires_at, is_active')
      .eq('access_code', sanitizedCode)
      .eq('is_active', true)
      .single();

    if (verifyError || !tester) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired access code' }),
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

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === tester.email);

    if (!existingUser) {
      // Create the user with the access code as password
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: tester.email,
        password: sanitizedCode,
        email_confirm: true, // Auto-confirm email
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

      console.log(`Created beta account for ${tester.email}`);
    } else {
      // Existing user: update their password to the access code for beta sign-in
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        { password: sanitizedCode }
      );

      if (updateError) {
        console.error('Error updating user password:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to configure account for beta access' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Updated beta access for existing user ${tester.email}`);
    }

    // Record the access
    await supabaseAdmin
      .from('beta_testers')
      .update({ 
        last_accessed_at: new Date().toISOString(),
        access_count: (tester as any).access_count ? (tester as any).access_count + 1 : 1
      })
      .eq('id', tester.id);

    // Return credentials for client-side sign in
    return new Response(
      JSON.stringify({ 
        success: true,
        email: tester.email,
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
