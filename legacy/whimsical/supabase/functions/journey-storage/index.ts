import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// D1 schema for drive data - each journey gets this table structure
const D1_SCHEMA = `
CREATE TABLE IF NOT EXISTS drives (
  id TEXT PRIMARY KEY,
  drive_id INTEGER UNIQUE NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_drives_started_at ON drives(started_at);

CREATE TABLE IF NOT EXISTS charges (
  id TEXT PRIMARY KEY,
  charge_id INTEGER UNIQUE,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  latitude REAL,
  longitude REAL,
  location TEXT,
  energy_added REAL,
  start_battery INTEGER,
  end_battery INTEGER,
  max_charge_rate REAL,
  charger_type TEXT,
  cost REAL,
  synced_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_charges_started_at ON charges(started_at);

CREATE TABLE IF NOT EXISTS sync_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  synced_at TEXT DEFAULT (datetime('now')),
  drives_synced INTEGER DEFAULT 0,
  charges_synced INTEGER DEFAULT 0,
  status TEXT,
  error_message TEXT
);
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const CF_API_TOKEN = Deno.env.get('CLOUDFLARE_API_TOKEN');
    const CF_ACCOUNT_ID = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');

    if (!CF_API_TOKEN || !CF_ACCOUNT_ID) {
      return new Response(JSON.stringify({ error: 'Cloudflare credentials not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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

    const { action, journeyId, journeyName } = await req.json();

    switch (action) {
      case 'provision': {
        // Create a new D1 database for this journey
        const dbName = `aww-journey-${journeyId.slice(0, 8)}`;
        
        console.log(`Provisioning D1 database: ${dbName}`);

        // Create D1 database
        const createResponse = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${CF_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: dbName }),
          }
        );

        const createResult = await createResponse.json();
        
        if (!createResult.success) {
          console.error('Failed to create D1:', createResult.errors);
          throw new Error(`Failed to create D1 database: ${JSON.stringify(createResult.errors)}`);
        }

        const d1DatabaseId = createResult.result.uuid;
        console.log(`D1 database created: ${d1DatabaseId}`);

        // Initialize schema
        const schemaResponse = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${d1DatabaseId}/query`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${CF_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sql: D1_SCHEMA }),
          }
        );

        const schemaResult = await schemaResponse.json();
        if (!schemaResult.success) {
          console.error('Failed to initialize schema:', schemaResult.errors);
        }

        // Update journey with D1 info
        const { error: updateError } = await supabase
          .from('journeys')
          .update({
            cloudflare_d1_id: d1DatabaseId,
            cloudflare_d1_name: dbName,
            data_storage_type: 'cloudflare_d1',
          })
          .eq('id', journeyId)
          .eq('user_id', user.id);

        if (updateError) {
          console.error('Failed to update journey:', updateError);
          throw new Error(`Failed to update journey: ${updateError.message}`);
        }

        console.log(`Journey ${journeyId} provisioned with D1 ${d1DatabaseId}`);

        return new Response(JSON.stringify({
          success: true,
          d1DatabaseId,
          d1DatabaseName: dbName,
          message: 'D1 database provisioned and schema initialized',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'status': {
        // Get D1 database status for a journey
        const { data: journey, error: journeyError } = await supabase
          .from('journeys')
          .select('cloudflare_d1_id, cloudflare_d1_name, data_storage_type')
          .eq('id', journeyId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (journeyError || !journey) {
          return new Response(JSON.stringify({ error: 'Journey not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (!journey.cloudflare_d1_id) {
          return new Response(JSON.stringify({
            provisioned: false,
            storageType: journey.data_storage_type,
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Get stats from D1
        const statsResponse = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${journey.cloudflare_d1_id}/query`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${CF_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sql: `SELECT 
                (SELECT COUNT(*) FROM drives) as drive_count,
                (SELECT COUNT(*) FROM charges) as charge_count,
                (SELECT MAX(synced_at) FROM sync_log) as last_sync`,
            }),
          }
        );

        const statsResult = await statsResponse.json();
        const stats = statsResult.result?.[0]?.results?.[0] || {};

        return new Response(JSON.stringify({
          provisioned: true,
          d1DatabaseId: journey.cloudflare_d1_id,
          d1DatabaseName: journey.cloudflare_d1_name,
          storageType: journey.data_storage_type,
          stats,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'export': {
        // Export journey data from D1 for user download
        const { data: journey, error: journeyError } = await supabase
          .from('journeys')
          .select('cloudflare_d1_id, cloudflare_d1_name, name')
          .eq('id', journeyId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (journeyError || !journey) {
          return new Response(JSON.stringify({ error: 'Journey not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (!journey.cloudflare_d1_id) {
          return new Response(JSON.stringify({ error: 'No D1 database for this journey' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Fetch all drives
        const drivesResponse = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${journey.cloudflare_d1_id}/query`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${CF_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sql: 'SELECT * FROM drives ORDER BY started_at' }),
          }
        );
        const drivesResult = await drivesResponse.json();

        // Fetch all charges
        const chargesResponse = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${journey.cloudflare_d1_id}/query`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${CF_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sql: 'SELECT * FROM charges ORDER BY started_at' }),
          }
        );
        const chargesResult = await chargesResponse.json();

        const exportData = {
          journey: {
            id: journeyId,
            name: journey.name,
            exportedAt: new Date().toISOString(),
          },
          drives: drivesResult.result?.[0]?.results || [],
          charges: chargesResult.result?.[0]?.results || [],
        };

        // Update journey with export timestamp
        await supabase
          .from('journeys')
          .update({ export_generated_at: new Date().toISOString() })
          .eq('id', journeyId)
          .eq('user_id', user.id);

        console.log(`Exported journey ${journeyId}: ${exportData.drives.length} drives, ${exportData.charges.length} charges`);

        return new Response(JSON.stringify({
          success: true,
          data: exportData,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'archive': {
        // Archive journey - calculate expiration based on user activity
        // Inactive = 90 days no login, then 90 more days retention = 180 days max total
        const { data: profile } = await supabase
          .from('profiles')
          .select('last_active_at')
          .eq('user_id', user.id)
          .maybeSingle();

        // Determine if user is "active" (logged in within last 90 days)
        const lastActive = profile?.last_active_at ? new Date(profile.last_active_at) : new Date();
        const daysSinceActive = Math.floor((Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
        const isActiveUser = daysSinceActive <= 90;

        // Active users: 1 year, Inactive users (>90 days): 90 days retention
        // This means inactive users have max 180 days total (90 inactive + 90 retention)
        const retentionDays = isActiveUser ? 365 : 90;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + retentionDays);

        const { error: archiveError } = await supabase
          .from('journeys')
          .update({
            archived_at: new Date().toISOString(),
            archive_expires_at: expiresAt.toISOString(),
          })
          .eq('id', journeyId)
          .eq('user_id', user.id);

        if (archiveError) {
          throw new Error(`Failed to archive journey: ${archiveError.message}`);
        }

        console.log(`Archived journey ${journeyId}, expires ${expiresAt.toISOString()} (${retentionDays} days, active=${isActiveUser})`);

        return new Response(JSON.stringify({
          success: true,
          archivedAt: new Date().toISOString(),
          expiresAt: expiresAt.toISOString(),
          retentionDays,
          isActiveUser,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'unarchive': {
        // Restore archived journey
        const { error: unarchiveError } = await supabase
          .from('journeys')
          .update({
            archived_at: null,
            archive_expires_at: null,
          })
          .eq('id', journeyId)
          .eq('user_id', user.id);

        if (unarchiveError) {
          throw new Error(`Failed to unarchive journey: ${unarchiveError.message}`);
        }

        console.log(`Unarchived journey ${journeyId}`);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete': {
        // Delete D1 database and journey completely
        const { data: journey } = await supabase
          .from('journeys')
          .select('cloudflare_d1_id, vehicle_id')
          .eq('id', journeyId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (journey?.cloudflare_d1_id) {
          console.log(`Deleting D1 database: ${journey.cloudflare_d1_id}`);
          const deleteResponse = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${journey.cloudflare_d1_id}`,
            {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${CF_API_TOKEN}`,
              },
            }
          );
          const deleteResult = await deleteResponse.json();
          console.log('D1 delete result:', deleteResult);
        }

        // Delete related data in order (respecting foreign keys)
        await supabase.from('drive_data').delete().eq('journey_id', journeyId);
        await supabase.from('charging_sessions').delete().eq('journey_id', journeyId);
        await supabase.from('journal_entries').delete().eq('journey_id', journeyId);
        await supabase.from('journey_media').delete().eq('journey_id', journeyId);
        await supabase.from('states_visited').delete().eq('journey_id', journeyId);
        await supabase.from('journey_followers').delete().eq('journey_id', journeyId);

        // Delete the journey itself
        const { error: deleteError } = await supabase
          .from('journeys')
          .delete()
          .eq('id', journeyId)
          .eq('user_id', user.id);

        if (deleteError) {
          throw new Error(`Failed to delete journey: ${deleteError.message}`);
        }

        console.log(`Deleted journey ${journeyId} and all associated data`);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

  } catch (error) {
    console.error('Journey storage error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
