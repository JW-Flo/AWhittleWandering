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
    const CF_API_TOKEN = Deno.env.get('CLOUDFLARE_API_TOKEN');
    const CF_ACCOUNT_ID = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
    const CF_D1_DATABASE_ID = Deno.env.get('CLOUDFLARE_D1_DATABASE_ID');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!TESSIE_API_KEY) throw new Error('TESSIE_API_KEY not configured');
    if (!CF_API_TOKEN || !CF_ACCOUNT_ID || !CF_D1_DATABASE_ID) {
      throw new Error('Cloudflare credentials not configured');
    }

    // Authentication: Only allow admin users or service role calls
    const authHeader = req.headers.get('Authorization');
    const isServiceCall = authHeader === `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`;
    
    if (!isServiceCall) {
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
        global: { headers: { Authorization: authHeader } }
      });

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

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
      console.log('Tessie Cloudflare sync authorized for admin user:', user.id);
    } else {
      console.log('Tessie Cloudflare sync authorized via service role key');
    }

    const body = await req.json();
    const { vin, fromDate, toDate, fullSync = false, createTable = false } = body;

    if (!vin) throw new Error('VIN is required');

    console.log(`Starting Tessie -> Cloudflare D1 sync for VIN ${vin}`);

    // Create table if requested
    if (createTable) {
      console.log('Creating tessie_drives table in D1...');
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS tessie_drives (
          id TEXT PRIMARY KEY,
          tessie_drive_id INTEGER UNIQUE NOT NULL,
          vin TEXT NOT NULL,
          started_at TEXT NOT NULL,
          ended_at TEXT NOT NULL,
          starting_latitude REAL NOT NULL,
          starting_longitude REAL NOT NULL,
          starting_location TEXT,
          starting_odometer REAL,
          starting_battery INTEGER,
          ending_latitude REAL NOT NULL,
          ending_longitude REAL NOT NULL,
          ending_location TEXT,
          ending_odometer REAL,
          ending_battery INTEGER,
          odometer_distance REAL,
          energy_used REAL,
          average_speed REAL,
          max_speed REAL,
          average_inside_temp REAL,
          average_outside_temp REAL,
          synced_at TEXT DEFAULT (datetime('now')),
          created_at TEXT DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_tessie_drives_vin ON tessie_drives(vin);
        CREATE INDEX IF NOT EXISTS idx_tessie_drives_started_at ON tessie_drives(started_at);
      `;

      const createResponse = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_D1_DATABASE_ID}/query`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${CF_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sql: createTableSQL }),
        }
      );

      const createResult = await createResponse.json();
      console.log('Table creation result:', JSON.stringify(createResult));

      if (!createResult.success) {
        console.error('Failed to create table:', createResult.errors);
      }
    }

    // Get last synced timestamp from D1 for incremental sync
    let lastSyncedTimestamp = 0;
    if (!fullSync) {
      const lastDriveResponse = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_D1_DATABASE_ID}/query`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${CF_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sql: `SELECT started_at FROM tessie_drives WHERE vin = ? ORDER BY started_at DESC LIMIT 1`,
            params: [vin],
          }),
        }
      );

      const lastDriveResult = await lastDriveResponse.json();
      if (lastDriveResult.success && lastDriveResult.result?.[0]?.results?.length > 0) {
        const lastStartedAt = lastDriveResult.result[0].results[0].started_at;
        lastSyncedTimestamp = new Date(lastStartedAt).getTime() / 1000;
        console.log(`Incremental sync from ${lastStartedAt}`);
      }
    }

    // Build Tessie API query params
    const params = new URLSearchParams();
    if (fromDate) params.append('from', fromDate.toString());
    else if (lastSyncedTimestamp) params.append('from', lastSyncedTimestamp.toString());
    if (toDate) params.append('to', toDate.toString());

    const drivesUrl = `https://api.tessie.com/${vin}/drives?${params.toString()}`;
    console.log(`Fetching from Tessie: ${drivesUrl}`);

    const tessieResponse = await fetch(drivesUrl, {
      headers: {
        'Authorization': `Bearer ${TESSIE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!tessieResponse.ok) {
      const errorText = await tessieResponse.text();
      throw new Error(`Tessie API error: ${tessieResponse.status} ${errorText}`);
    }

    const tessieData = await tessieResponse.json();
    const drives: TessieDrive[] = tessieData.results || [];

    console.log(`Retrieved ${drives.length} drives from Tessie`);

    if (drives.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No new drives to sync',
        synced: 0,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert drives into D1 in batches
    let totalSynced = 0;
    const batchSize = 50; // D1 has limits on query complexity

    for (let i = 0; i < drives.length; i += batchSize) {
      const batch = drives.slice(i, i + batchSize);
      
      // Use INSERT OR REPLACE for upsert behavior
      for (const drive of batch) {
        const id = crypto.randomUUID();
        const insertSQL = `
          INSERT OR REPLACE INTO tessie_drives (
            id, tessie_drive_id, vin, started_at, ended_at,
            starting_latitude, starting_longitude, starting_location, starting_odometer, starting_battery,
            ending_latitude, ending_longitude, ending_location, ending_odometer, ending_battery,
            odometer_distance, energy_used, average_speed, max_speed,
            average_inside_temp, average_outside_temp, synced_at
          ) VALUES (
            COALESCE((SELECT id FROM tessie_drives WHERE tessie_drive_id = ?), ?),
            ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, datetime('now')
          )
        `;

        const insertResponse = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_D1_DATABASE_ID}/query`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${CF_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sql: insertSQL,
              params: [
                drive.id, id,
                drive.id, vin,
                new Date(drive.started_at * 1000).toISOString(),
                new Date(drive.ended_at * 1000).toISOString(),
                drive.starting_latitude, drive.starting_longitude,
                drive.starting_location || null, drive.starting_odometer || null, drive.starting_battery || null,
                drive.ending_latitude, drive.ending_longitude,
                drive.ending_location || null, drive.ending_odometer || null, drive.ending_battery || null,
                drive.odometer_distance || null, drive.energy_used || null,
                drive.average_speed || null, drive.max_speed || null,
                drive.average_inside_temperature || null, drive.average_outside_temperature || null,
              ],
            }),
          }
        );

        const insertResult = await insertResponse.json();
        if (insertResult.success) {
          totalSynced++;
        } else {
          console.error(`Failed to insert drive ${drive.id}:`, insertResult.errors);
        }
      }

      console.log(`Batch ${Math.floor(i / batchSize) + 1}: synced ${batch.length} drives`);
    }

    console.log(`Sync complete: ${totalSynced} drives synced to Cloudflare D1`);

    return new Response(JSON.stringify({
      success: true,
      synced: totalSynced,
      totalDrives: drives.length,
      destination: 'cloudflare_d1',
      dateRange: {
        from: drives[drives.length - 1]?.started_at
          ? new Date(drives[drives.length - 1].started_at * 1000).toISOString()
          : null,
        to: drives[0]?.started_at
          ? new Date(drives[0].started_at * 1000).toISOString()
          : null,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Tessie Cloudflare sync error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
