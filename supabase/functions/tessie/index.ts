import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // AUTHENTICATION REQUIRED
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Check if service call
    const isServiceCall = authHeader === `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`;
    
    if (!isServiceCall) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } }
      });

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Only admins can access Tessie API
      const { data: isAdmin } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });

      if (!isAdmin) {
        return new Response(JSON.stringify({ error: 'Admin access required' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      console.log('Tessie API authorized for admin user:', user.id);
    } else {
      console.log('Tessie API authorized via service role key');
    }

    const TESSIE_API_KEY = Deno.env.get('TESSIE_API_KEY');
    if (!TESSIE_API_KEY) {
      throw new Error('TESSIE_API_KEY is not configured');
    }

    const { action, vin, fromDate, toDate } = await req.json();
    console.log(`Tessie API request: action=${action}, vin=${vin}, fromDate=${fromDate}, toDate=${toDate}`);

    let endpoint = '';
    const params = new URLSearchParams();
    
    // Add date filters if provided (Unix timestamps)
    if (fromDate) params.append('from', fromDate.toString());
    if (toDate) params.append('to', toDate.toString());

    switch (action) {
      case 'vehicles':
        endpoint = 'https://api.tessie.com/vehicles';
        break;
      case 'state':
        if (!vin) throw new Error('VIN required for state');
        endpoint = `https://api.tessie.com/${vin}/state`;
        break;
      case 'location':
        if (!vin) throw new Error('VIN required for location');
        endpoint = `https://api.tessie.com/${vin}/location`;
        break;
      case 'battery':
        if (!vin) throw new Error('VIN required for battery');
        endpoint = `https://api.tessie.com/${vin}/battery`;
        break;
      case 'drives':
        if (!vin) throw new Error('VIN required for drives');
        endpoint = `https://api.tessie.com/${vin}/drives`;
        break;
      case 'charges':
        if (!vin) throw new Error('VIN required for charges');
        endpoint = `https://api.tessie.com/${vin}/charges`;
        break;
      case 'historical':
        // Get drives within a specific date range with pagination support
        if (!vin) throw new Error('VIN required for historical');
        endpoint = `https://api.tessie.com/${vin}/drives`;
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // Append query params if any
    const queryString = params.toString();
    if (queryString) {
      endpoint += `?${queryString}`;
    }

    console.log(`Calling Tessie: ${endpoint}`);

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TESSIE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Tessie API error: ${response.status} ${errorText}`);
      throw new Error(`Tessie API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Tessie API success: ${action}, results count: ${data.results?.length || 'N/A'}`);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Tessie function error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
