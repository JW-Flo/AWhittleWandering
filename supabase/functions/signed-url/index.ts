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
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Verify user with anon key
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { file_path, journey_id } = await req.json();

    if (!file_path) {
      return new Response(JSON.stringify({ error: 'file_path is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use service role to check access and generate signed URL
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user has access to this file
    // User can access if:
    // 1. They own the file (file path starts with their user ID)
    // 2. They are an approved follower of the journey
    // 3. They own the journey
    
    const fileOwnerUserId = file_path.split('/')[0];
    let hasAccess = false;

    // Check if user owns the file
    if (fileOwnerUserId === user.id) {
      hasAccess = true;
    }

    // If not owner, check journey access
    if (!hasAccess && journey_id) {
      // Check if user owns the journey
      const { data: journey } = await supabase
        .from('journeys')
        .select('user_id')
        .eq('id', journey_id)
        .single();

      if (journey?.user_id === user.id) {
        hasAccess = true;
      }

      // Check if user is an approved follower
      if (!hasAccess) {
        const { data: follower } = await supabase
          .from('journey_followers')
          .select('id')
          .eq('journey_id', journey_id)
          .eq('follower_user_id', user.id)
          .eq('approved', true)
          .single();

        if (follower) {
          hasAccess = true;
        }
      }
    }

    if (!hasAccess) {
      console.warn(`[signed-url] Access denied for user ${user.id} to file ${file_path}`);
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate signed URL (valid for 1 hour)
    const { data: signedUrl, error: signError } = await supabase.storage
      .from('journey-photos')
      .createSignedUrl(file_path, 3600); // 1 hour expiry

    if (signError) {
      console.error('[signed-url] Error generating signed URL:', signError);
      return new Response(JSON.stringify({ error: 'Failed to generate URL' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ url: signedUrl.signedUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[signed-url] Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
