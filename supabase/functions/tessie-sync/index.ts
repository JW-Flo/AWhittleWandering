import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TessieDrive {
  id: number;
  started_at: number;
  ended_at: number;
  starting_latitude: number;
  starting_longitude: number;
  starting_location: string;
  starting_odometer: number;
  starting_battery: number;
  ending_latitude: number;
  ending_longitude: number;
  ending_location: string;
  ending_odometer: number;
  ending_battery: number;
  odometer_distance: number;
  energy_used: number;
  average_speed: number;
  max_speed: number;
  average_inside_temperature: number;
  average_outside_temperature: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TESSIE_API_KEY = Deno.env.get('TESSIE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!TESSIE_API_KEY) {
      console.error('TESSIE_API_KEY not configured');
      throw new Error('TESSIE_API_KEY not configured');
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Supabase credentials not configured');
      throw new Error('Supabase credentials not configured');
    }

    console.log('Environment check passed, creating Supabase client');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json();
    const { vin, fromDate, toDate, fullSync = false } = body;
    
    console.log(`Request body: ${JSON.stringify(body)}`);

    if (!vin) throw new Error('VIN is required');

    console.log(`Starting Tessie sync for VIN ${vin}, fullSync=${fullSync}`);

    // Get the most recent drive we have stored (for incremental sync)
    let lastSyncedTimestamp = 0;
    if (!fullSync) {
      const { data: lastDrive } = await supabase
        .from('tessie_drives')
        .select('started_at')
        .eq('vin', vin)
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      if (lastDrive) {
        lastSyncedTimestamp = new Date(lastDrive.started_at).getTime() / 1000;
        console.log(`Incremental sync from ${lastDrive.started_at}`);
      }
    }

    // Build query params
    const params = new URLSearchParams();
    if (fromDate) params.append('from', fromDate.toString());
    else if (lastSyncedTimestamp) params.append('from', lastSyncedTimestamp.toString());
    if (toDate) params.append('to', toDate.toString());

    const drivesUrl = `https://api.tessie.com/${vin}/drives?${params.toString()}`;
    console.log(`Fetching from Tessie: ${drivesUrl}`);

    const response = await fetch(drivesUrl, {
      headers: {
        'Authorization': `Bearer ${TESSIE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Tessie API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const drives: TessieDrive[] = data.results || [];

    console.log(`Retrieved ${drives.length} drives from Tessie`);

    if (drives.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No new drives to sync',
        synced: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Transform and upsert drives
    const drivesToInsert = drives.map(d => ({
      tessie_drive_id: d.id,
      vin,
      started_at: new Date(d.started_at * 1000).toISOString(),
      ended_at: new Date(d.ended_at * 1000).toISOString(),
      starting_latitude: d.starting_latitude,
      starting_longitude: d.starting_longitude,
      starting_location: d.starting_location,
      starting_odometer: d.starting_odometer,
      starting_battery: d.starting_battery,
      ending_latitude: d.ending_latitude,
      ending_longitude: d.ending_longitude,
      ending_location: d.ending_location,
      ending_odometer: d.ending_odometer,
      ending_battery: d.ending_battery,
      odometer_distance: d.odometer_distance,
      energy_used: d.energy_used,
      average_speed: d.average_speed,
      max_speed: d.max_speed,
      average_inside_temp: d.average_inside_temperature,
      average_outside_temp: d.average_outside_temperature,
      synced_at: new Date().toISOString(),
    }));

    // Upsert in batches of 500
    const batchSize = 500;
    let totalInserted = 0;
    let totalUpdated = 0;

    for (let i = 0; i < drivesToInsert.length; i += batchSize) {
      const batch = drivesToInsert.slice(i, i + batchSize);
      
      const { data: upsertData, error } = await supabase
        .from('tessie_drives')
        .upsert(batch, { 
          onConflict: 'tessie_drive_id',
          ignoreDuplicates: false 
        })
        .select('id');

      if (error) {
        console.error('Upsert error:', error);
        throw new Error(`Database upsert failed: ${error.message}`);
      }

      totalInserted += upsertData?.length || 0;
      console.log(`Batch ${Math.floor(i/batchSize) + 1}: upserted ${batch.length} drives`);
    }

    console.log(`Sync complete: ${totalInserted} drives synced`);

    return new Response(JSON.stringify({
      success: true,
      synced: totalInserted,
      totalDrives: drives.length,
      dateRange: {
        from: drives[drives.length - 1]?.started_at 
          ? new Date(drives[drives.length - 1].started_at * 1000).toISOString() 
          : null,
        to: drives[0]?.started_at 
          ? new Date(drives[0].started_at * 1000).toISOString() 
          : null,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Tessie sync error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
