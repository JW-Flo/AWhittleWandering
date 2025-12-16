import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Query Cloudflare D1 for drive statistics
    const CF_API_TOKEN = Deno.env.get('CLOUDFLARE_API_TOKEN');
    const CF_ACCOUNT_ID = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
    const CF_D1_DATABASE_ID = Deno.env.get('CLOUDFLARE_D1_DATABASE_ID');

    if (!CF_API_TOKEN || !CF_ACCOUNT_ID || !CF_D1_DATABASE_ID) {
      return new Response(JSON.stringify({ error: 'Cloudflare credentials not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { query = 'summary' } = await req.json().catch(() => ({}));

    let sql: string;
    
    switch (query) {
      case 'summary':
        sql = `
          SELECT 
            COUNT(*) as total_drives,
            ROUND(SUM(odometer_distance), 1) as total_miles,
            ROUND(SUM(energy_used), 1) as total_kwh,
            ROUND(AVG(average_speed), 1) as avg_speed,
            MAX(max_speed) as top_speed,
            MIN(started_at) as first_drive,
            MAX(ended_at) as last_drive,
            COUNT(DISTINCT DATE(started_at)) as drive_days
          FROM tessie_drives
        `;
        break;
      case 'daily':
        sql = `
          SELECT 
            DATE(started_at) as drive_date,
            COUNT(*) as drives,
            ROUND(SUM(odometer_distance), 1) as miles,
            ROUND(SUM(energy_used), 1) as kwh,
            ROUND(AVG(average_speed), 1) as avg_speed
          FROM tessie_drives
          GROUP BY DATE(started_at)
          ORDER BY drive_date DESC
          LIMIT 30
        `;
        break;
      case 'recent':
        sql = `
          SELECT 
            tessie_drive_id,
            started_at,
            ended_at,
            starting_location,
            ending_location,
            odometer_distance,
            energy_used,
            average_speed,
            starting_battery,
            ending_battery
          FROM tessie_drives
          ORDER BY started_at DESC
          LIMIT 20
        `;
        break;
      case 'efficiency':
        sql = `
          SELECT 
            ROUND(SUM(energy_used) * 1000 / NULLIF(SUM(odometer_distance), 0), 0) as wh_per_mile,
            ROUND(AVG(average_outside_temp), 1) as avg_outside_temp,
            ROUND(AVG(average_inside_temp), 1) as avg_inside_temp,
            COUNT(*) as sample_size
          FROM tessie_drives
          WHERE odometer_distance > 0
        `;
        break;
      default:
        sql = 'SELECT COUNT(*) as count FROM tessie_drives';
    }

    console.log(`Admin D1 query: ${query}`);

    const d1Response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_D1_DATABASE_ID}/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CF_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql }),
      }
    );

    const d1Result = await d1Response.json();

    if (!d1Result.success) {
      console.error('D1 query failed:', d1Result.errors);
      return new Response(JSON.stringify({ error: 'D1 query failed', details: d1Result.errors }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results = d1Result.result?.[0]?.results || [];

    return new Response(JSON.stringify({
      success: true,
      query,
      data: results,
      meta: d1Result.result?.[0]?.meta,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('D1 stats error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
