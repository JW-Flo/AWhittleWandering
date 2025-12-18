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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin access
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check admin role
    const { data: isAdmin } = await supabase.rpc('has_role', { 
      _user_id: user.id, 
      _role: 'admin' 
    });

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, userId } = await req.json();

    if (action === 'list_users') {
      // Get all users from auth.users using admin API
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error('Error listing users:', authError);
        return new Response(
          JSON.stringify({ error: 'Failed to list users' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get profiles and roles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, display_name, account_status, last_active_at, avatar_url, bio');

      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      // Get notification preferences for contact info
      const { data: notificationPrefs } = await supabase
        .from('notification_preferences')
        .select('user_id, phone_number, email_enabled, sms_enabled');

      // Get journey counts per user
      const { data: journeys } = await supabase
        .from('journeys')
        .select('user_id');

      const journeyCounts = new Map<string, number>();
      journeys?.forEach(j => {
        journeyCounts.set(j.user_id, (journeyCounts.get(j.user_id) || 0) + 1);
      });

      // Combine data
      const users = authUsers.users.map(authUser => {
        const profile = profiles?.find(p => p.user_id === authUser.id);
        const role = roles?.find(r => r.user_id === authUser.id);
        const prefs = notificationPrefs?.find(p => p.user_id === authUser.id);

        return {
          id: authUser.id,
          email: authUser.email,
          phone: authUser.phone || prefs?.phone_number,
          full_name: profile?.full_name,
          display_name: profile?.display_name,
          avatar_url: profile?.avatar_url,
          bio: profile?.bio,
          role: role?.role || 'user',
          account_status: profile?.account_status || 'active',
          email_confirmed_at: authUser.email_confirmed_at,
          last_sign_in_at: authUser.last_sign_in_at,
          last_active_at: profile?.last_active_at,
          created_at: authUser.created_at,
          journey_count: journeyCounts.get(authUser.id) || 0,
          email_enabled: prefs?.email_enabled ?? true,
          sms_enabled: prefs?.sms_enabled ?? false,
          providers: authUser.app_metadata?.providers || ['email']
        };
      });

      return new Response(
        JSON.stringify({ users }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get_user_details' && userId) {
      // Get specific user details
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
      
      if (authError || !authUser) {
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const [profileRes, rolesRes, prefsRes, journeysRes, auditRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', userId).single(),
        supabase.from('user_roles').select('*').eq('user_id', userId),
        supabase.from('notification_preferences').select('*').eq('user_id', userId).single(),
        supabase.from('journeys').select('id, name, created_at, is_public, total_miles').eq('user_id', userId),
        supabase.from('security_audit_log').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20)
      ]);

      return new Response(
        JSON.stringify({
          user: {
            id: authUser.user.id,
            email: authUser.user.email,
            phone: authUser.user.phone,
            email_confirmed_at: authUser.user.email_confirmed_at,
            last_sign_in_at: authUser.user.last_sign_in_at,
            created_at: authUser.user.created_at,
            providers: authUser.user.app_metadata?.providers || ['email']
          },
          profile: profileRes.data,
          roles: rolesRes.data,
          preferences: prefsRes.data,
          journeys: journeysRes.data,
          audit_log: auditRes.data
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Unknown action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Admin users error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
